import copy
import unittest
from recommendation_staging import generate, pair_fingerprint, reviewed_pairs


class StagingTests(unittest.TestCase):
    def setUp(self):
        self.source = {'id': 11, 'locale': 'ru-RU', 'jurisdiction': 'RU', 'taskType': 'maintenance',
                       'hazardType': 'pressure', 'targetType': 'pipe', 'task_text': 'Fixture task',
                       'hazard_name': 'Fixture hazard', 'conditions': ['isolatable']}
        self.target = {**self.source, 'id': 22, 'measure_text': 'Fixture control'}
        self.pair = {'sourceId': 11, 'targetId': 22, 'conditions': ['isolatable'], 'exclusions': ['live-work']}
        self.approve()

    def approve(self):
        # Synthetic approval for tests; never serialized into production data.
        self.pair['review'] = {'status': 'approved', 'reviewer': 'TEST ONLY', 'reviewedAt': '2026-01-01',
                               'contentHash': pair_fingerprint(self.source, self.target, self.pair)}

    def options(self):
        return dict(locale='ru-RU', kind='current',
                    model_id='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
                    model_revision='a' * 40, encode=lambda texts: [[1, 0], [.6, .8]])

    def run_generation(self, **changes):
        return generate([self.source], [self.target], [self.pair], **{**self.options(), **changes})

    def test_korean_model_cannot_process_russian(self):
        with self.assertRaisesRegex(ValueError, 'support'):
            self.run_generation(model_id='jhgan/ko-sbert-nli')

    def test_raw_percent_is_preserved_without_forcing_three_candidates(self):
        result = self.run_generation()
        self.assertEqual(len(result['mappings']), 1)
        self.assertAlmostEqual(result['mappings'][0]['score'], .6)
        self.assertEqual(result['status'], 'needs_independent_evaluation')
        self.assertEqual(result['scoreKind'], 'text_similarity')
        self.assertEqual(result['modelRevision'], 'a' * 40)

    def test_incompatible_hazard_fails_before_embedding(self):
        self.target['hazardType'] = 'noise'
        self.approve()
        with self.assertRaisesRegex(ValueError, 'context'):
            self.run_generation(encode=lambda _: self.fail('Must not embed incompatible data'))

    def test_changed_control_cannot_reuse_review(self):
        self.target['measure_text'] = 'Different control'
        with self.assertRaisesRegex(ValueError, 'exact pair'):
            self.run_generation()

    def test_excluded_work_is_not_filled_with_unreviewed_alternatives(self):
        self.source['conditions'].append('live-work')
        self.approve()
        result = self.run_generation(encode=lambda _: self.fail('No eligible pairs'))
        self.assertEqual(result['mappings'], [])

    def test_advanced_requires_hazard_and_current_control(self):
        self.source['measure_text'] = 'Existing control'
        self.target['solution_text'] = 'Additional control'
        self.approve()
        with self.assertRaisesRegex(ValueError, 'original hazard'):
            self.run_generation(kind='advanced')

    def test_id_duplicates_and_mixed_languages_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Ambiguous'):
            reviewed_pairs([self.source, copy.deepcopy(self.source)], [self.target], [self.pair], 'ru-RU', 'current')
        self.target['locale'] = 'ko-KR'
        with self.assertRaisesRegex(ValueError, 'locale'):
            self.run_generation()


if __name__ == '__main__':
    unittest.main()
