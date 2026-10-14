"""Offline generation of reviewed candidate pairs. Never produces production SQL.

The multilingual model is a comparison candidate, not an accuracy claim. Pair
reviews and independent held-out evaluation are still required before publication.
"""
import argparse
import hashlib
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

MODELS = {
    'jhgan/ko-sbert-nli': {'ko'},
    'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2':
        {'ko', 'en', 'de', 'ja', 'fr', 'it', 'es', 'ar', 'pt', 'ru'},
}


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def pair_fingerprint(source, target, pair):
    return digest({'source': source, 'target': target,
                   'conditions': pair.get('conditions'), 'exclusions': pair.get('exclusions')})


def reviewed_pairs(sources, targets, pairs, locale, kind):
    def index(rows):
        result = {}
        for row in rows:
            if row.get('locale') != locale or row.get('id') is None:
                raise ValueError('Every input row needs an explicit translation ID and the requested locale')
            key = str(row['id'])
            if key in result:
                raise ValueError('Ambiguous translation ID')
            result[key] = row
        return result
    source_rows, target_rows = index(sources), index(targets)
    result, seen = [], set()
    source_text = 'hazard_name' if kind == 'current' else 'measure_text'
    target_text = 'measure_text' if kind == 'current' else 'solution_text'
    for pair in pairs:
        key = (str(pair.get('sourceId')), str(pair.get('targetId')))
        if key in seen:
            raise ValueError('Duplicate candidate pair')
        seen.add(key)
        source, target = source_rows.get(key[0]), target_rows.get(key[1])
        if not source or not target:
            raise ValueError('Missing translation reference')
        for field in ('jurisdiction', 'taskType', 'hazardType', 'targetType'):
            if not source.get(field) or source[field] != target.get(field):
                raise ValueError('Incompatible or missing work context')
        if not source.get(source_text) or not target.get(target_text) or not source.get('task_text'):
            raise ValueError('Task and actual text required')
        if kind == 'advanced' and (not source.get('hazard_translation_id') or not source.get('hazard_text')):
            raise ValueError('Advanced candidates require the original hazard as well as the current control')
        review = pair.get('review', {})
        if review.get('status') != 'approved' or not review.get('reviewer') or not review.get('reviewedAt') or review.get('contentHash') != pair_fingerprint(source, target, pair):
            raise ValueError('Recorded review of the exact pair and context required')
        required, excluded = pair.get('conditions'), pair.get('exclusions')
        if not isinstance(required, list) or not required or not isinstance(excluded, list):
            raise ValueError('Conditions and exclusions required')
        actual = set(source.get('conditions', []))
        if not set(required).issubset(actual) or set(excluded).intersection(actual):
            continue
        text = '\n'.join([source['task_text'], source.get('hazard_text', ''), source[source_text]])
        result.append((source, target, pair, text, target[target_text]))
    return result


def generate(sources, targets, pairs, *, locale, kind, model_id, model_revision, encode):
    if locale.split('-')[0] not in MODELS.get(model_id, set()):
        raise ValueError('Model does not have declared support for this language')
    if not re.fullmatch(r'[a-f0-9]{40}', model_revision):
        raise ValueError('Pin the model to a 40-character revision SHA')
    selected = reviewed_pairs(sources, targets, pairs, locale, kind)
    texts = list(dict.fromkeys(text for item in selected for text in item[3:]))
    vectors = dict(zip(texts, encode(texts))) if texts else {}
    if len(vectors) != len(texts):
        raise ValueError('Missing embeddings')
    mappings = []
    for source, target, pair, left, right in selected:
        a, b = vectors[left], vectors[right]
        if len(a) != len(b) or not len(a) or not all(math.isfinite(float(x)) for x in [*a, *b]):
            raise ValueError('Invalid embedding')
        denominator = math.sqrt(sum(float(x)**2 for x in a) * sum(float(x)**2 for x in b))
        if not denominator:
            raise ValueError('Zero-length embedding')
        score = sum(float(x)*float(y) for x, y in zip(a, b)) / denominator
        # A tiny floating-point overshoot may be normalized; never rescale rankings.
        if not -1.00000001 <= score <= 1.00000001:
            raise ValueError('Invalid cosine score')
        score = max(-1.0, min(1.0, score))
        mappings.append({'sourceTranslationId': source['id'], 'targetTranslationId': target['id'],
                         'originalHazardTranslationId': source.get('hazard_translation_id') if kind == 'advanced' else source['id'],
                         'kind': kind, 'score': score, 'displayEligible': score >= 0,
                         'reviewedPairHash': pair['review']['contentHash']})
    return {'schemaVersion': 1, 'status': 'needs_independent_evaluation',
            'locale': locale, 'scoreKind': 'text_similarity', 'model': model_id,
            'modelRevision': model_revision, 'generatedAt': datetime.now(timezone.utc).isoformat(),
            'inputDigest': digest([sources, targets, pairs]), 'mappings': mappings}


def main(kind):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('sources', 'targets', 'candidates', 'locale', 'model', 'model-revision', 'output'):
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if output.suffix.lower() != '.json' or output.exists():
        parser.error('Choose a new JSON staging output; production SQL and overwrites are not supported')
    read = lambda filename: json.loads(Path(filename).read_text(encoding='utf-8-sig'))
    sources, targets, pairs = read(args.sources), read(args.targets), read(args.candidates)
    # Check inputs before downloading/loading model weights.
    reviewed_pairs(sources, targets, pairs, args.locale, kind)
    if args.locale.split('-')[0] not in MODELS.get(args.model, set()) or not re.fullmatch(r'[a-f0-9]{40}', args.model_revision):
        parser.error('Choose a declared language-compatible model and pin its revision')
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(args.model, revision=args.model_revision, trust_remote_code=False)
    result = generate(sources, targets, pairs, locale=args.locale, kind=kind, model_id=args.model,
                      model_revision=args.model_revision, encode=lambda texts: model.encode(texts, show_progress_bar=True))
    with output.open('x', encoding='utf-8') as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
    print(f'Staged {len(result["mappings"])} reviewed candidate pairs. Independent evaluation and publication review remain required.')
