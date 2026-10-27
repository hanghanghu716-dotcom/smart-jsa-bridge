import { getCaseLanguages } from '../locales/config.js';
import { getGuideTitle } from '../locales/discoveryUi.js';
import { localeCountry } from './publicCountry.js';
import { RESOURCE_TOPICS, HUB_PAGE_SIZE } from './resourceHub.js';
// One bounded metadata query per selected collection. No private tables or PDF bodies.
export async function searchResources(locale, query, read, resources) {
  const types = query.type === 'all' ? ['jsa','case','guide','resource'] : [query.type];
  const size = query.type === 'all' ? 4 : HUB_PAGE_SIZE, offset = query.type === 'all' ? 0 : query.page * size;
  const text = query.q.replace(/[\\%_]/g, '\\$&');
  const groups = await Promise.all(types.map(async type => {
    let rows;
    if (type === 'jsa') {
      rows = await read('public_jsa_cards', { select:'id,title,public_locale,public_country,assessment',is_public:'eq.true',
        public_country:'eq.'+localeCountry(locale), ...(text?{title:'ilike.%'+text+'%'}:{}),order:'published_at.desc.nullslast,id.asc',limit:String(size+1),offset:String(offset) });
      rows = rows.filter(r => !r.assessment?.duplicate_of && r.assessment?.review !== 'rejected').map(r => ({title:r.title,href:`/${locale}/public-jsa/${r.id}`,language:r.public_locale}));
    } else if (type === 'case') {
      rows = await read('case_studies', { select:'id,post_group_id,title,language_code',language_code:'in.('+getCaseLanguages(locale).join(',')+')',
        ...(text?{title:'ilike.%'+text+'%'}:{}),order:'created_at.desc,id.asc',limit:String(size+1),offset:String(offset) });
      rows = rows.map(r => ({title:r.title,href:`/${locale}/case-study/${encodeURIComponent(r.post_group_id)}`,language:r.language_code}));
    } else if (type === 'guide') {
      rows = RESOURCE_TOPICS.map(key => ({title:getGuideTitle(key,locale),href:`/${locale}/guideline/${key}`,language:locale})).filter(r=>!query.q||r.title.toLocaleLowerCase().includes(query.q.toLocaleLowerCase())).slice(offset,offset+size+1);
    } else {
      const result = await resources();
      rows = result.items.map(r => ({title:r.title,href:r.url,language:r.locale,external:true,source:r.source}));
      return {type,rows:rows.slice(0,size),more:result.has_more||rows.length>size};
    }
    return {type,rows:rows.slice(0,size),more:rows.length>size};
  }));
  return {groups};
}
