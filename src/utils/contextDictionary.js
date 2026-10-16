import { dictionarySearchFilter } from './content.js';

// Case-stage datasets supersede legacy similarity mappings on the public dictionary.
// Legacy rows remain intact for recovery. This does not change the analysis recommendation engine.
export const CONTEXT_DICTIONARIES = {
  'en-US': { firstId: 1100001, lastId: 1101592 },
  'en-SG': { firstId: 1200001, lastId: 1201592 },
  'ja-JP': { firstId: 1300001, lastId: 1301592 },
};
export function scopeDictionary(query, locale) {
  const scope = CONTEXT_DICTIONARIES[locale];
  return scope ? query.gte('hazard_id', scope.firstId).lte('hazard_id', scope.lastId) : query;
}
export function contextDictionaryFilter(search) {
  const normalized = String(search).normalize('NFKC').toLowerCase();
  const tokens = [...new Set(normalized.match(/[a-z0-9]{3,}/g) || [])];
  return dictionarySearchFilter(normalized) + (tokens.length ? ',keywords.cs.{' + tokens.map(token => JSON.stringify(token)).join(',') + '}' : '');
}
export function contextDictionarySource(locale, id, index) {
  const source = index[locale];
  const offset = Number(id) - source?.firstId;
  if (!source || !Number.isSafeInteger(offset) || offset < 0 || offset >= source.articles.length * source.stepsPerArticle) return null;
  return source.articles[Math.floor(offset / source.stepsPerArticle)];
}
const english = country => ({
  intro: `Search work-stage hazards and proposed controls from 199 ${country} case studies. Each result keeps the hazards, controls and checks for one work stage together.`,
  howTo: 'Open the source case for scope, stop conditions and applicable references. Confirm the work method, equipment, conditions and local requirements before using a result.',
  count: '{{count}} work-stage hazard groups',
  groupHint: 'Search by task, hazard or control. Matching results include the complete work-stage control and verification set.',
  reference: 'AI-generated reference content. It has not been approved by a technical professional. A competent professional must review its suitability for the actual worksite; it is not a permit or a compliance certificate.',
  controlLabel: 'Proposed controls for this stage',
  checkLabel: 'Site checks and failure causes',
  sourceLabel: 'Source case, applicability and references',
});
export const contextDictionaryUi = locale => locale === 'ja-JP' ? {
  intro: '日本向けの199事例から、作業段階ごとの危険要因・対策案・確認事項を検索できます。各結果は同じ作業段階の内容を一組として表示します。',
  howTo: '原文の適用範囲・中止条件・参照資料を確認し、作業方法、設備、現場条件および適用される国内法令に照らして判断してください。',
  count: '作業段階別の危険要因 {{count}}組',
  groupHint: '作業名・危険要因・対策で検索できます。一致した作業段階の対策案と確認事項をまとめて表示します。',
  reference: 'AIで作成した参考情報です。技術専門家による承認を受けたものではありません。実際の使用前に、適切な知識を有する専門家による現場別の検討が必要です。作業許可や法令適合の証明にはなりません。',
  controlLabel: 'この段階の対策案', checkLabel: '現場確認事項・不具合要因', sourceLabel: '原文事例・適用範囲・参照資料',
} : locale === 'en-US' ? english('United States') : locale === 'en-SG' ? english('Singapore') : null;
