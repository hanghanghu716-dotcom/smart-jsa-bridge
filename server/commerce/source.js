import { readPublic } from '../public-content.js';
import { contentSnapshot } from './engine.js';
export async function readCommerceSnapshot(kind,id,locale,reader=readPublic){
 const rows=kind==='ugc'
  ? await reader('public_jsa_catalog',{select:'id,title,is_public,public_locale,publication_context,form_data,analysis_data',id:'eq.'+id,is_public:'eq.true',limit:'1'})
  : await reader('case_studies',{select:'id,title,language_code,content_md',post_group_id:'eq.'+id,language_code:'eq.'+locale,order:'created_at.desc,id.desc',limit:'1'});
 return contentSnapshot(kind,rows[0]);
}
