import { DIMENSIONAL_KEYWORD_MAP } from './TagDictionary.js';
import { publicTagLabel } from '../locales/publicTagLabels.js';
export const TAG_GROUPS = [['industry','categoryIndustry'],['safety','categorySafety'],['machine','categoryMachine'],['accident','categoryAccident']];
export function tagGroup(tag) {
 if (tag.startsWith('설비(')) return 'machine';
 if (tag.startsWith('사고(')) return 'accident';
 return /^(관리|준비|보호구|절차|마무리|기타)\(/.test(tag) ? 'safety' : 'industry';
}
export function browseTags(locale, search = '', group = '') {
 const query = search.normalize('NFKC').toLocaleLowerCase().trim();
 return Object.keys(DIMENSIONAL_KEYWORD_MAP).map(tag => ({ tag, label: publicTagLabel(tag, locale), group: tagGroup(tag) }))
  .filter(item => item.label && (!group || item.group === group) && (!query || (item.label + ' ' + item.tag).normalize('NFKC').toLocaleLowerCase().includes(query)));
}
