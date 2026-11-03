import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQueensland,parseCastillaLeon,parseTrudvsem,madridDeadline} from '../server/open-government-jobs.js';
import {collectJobs} from '../server/job-feeds.js';
import {renderJobHtml} from '../server/job-html.js';
import {jobQuery} from '../src/utils/jobs.js';
const qld='<ol class="search-results jobs"><li><h3><a href="/jobs/QLD-123"><span class="result-title"><strong>Senior Electrical Safety Inspector</strong>, Agency &amp; Training</span></a></h3><ul class="location"><li><strong class="locality">Brisbane</strong></li></ul><div class="search-description">PRIVATE CONTACT &amp; FULL DESCRIPTION<script>throw Error()</script></div><time class="date-closes" datetime="2026-11-11T23:59:59+10:00">closes 11-Nov-2026</time></li></ol>';
const es={total_count:1,results:[{titulo:'Seguridad e Higiene en el Trabajo',identificador:'123',organismo_gestor:'Junta de Castilla y León',fecha_de_inicio:'2026-10-01',fecha_de_finalizacion:'2026-11-03',enlace_al_contenido:'https://empleopublico.jcyl.es/convocatoria/123',requisitos_necesarios:'PRIVATE FULL TEXT'}]};
const ru={status:'200',meta:{total:1},results:{vacancies:[{vacancy:{id:'a1',source:'Вакансия работодателя','job-name':'Специалист по охране труда',vac_url:'https://trudvsem.ru/vacancy/card/1/a1',company:{name:'Employer',email:'PRIVATE'},region:{name:'Москва'},hireDate:'2026-11-01',contact_person:'PRIVATE',duty:'PRIVATE'}}]}};
test('Queensland metadata preserves attribution fields and source timezone without copying body',()=>{
 const rows=parseQueensland(qld);assert.equal(rows.length,1);assert.equal(rows[0].locale,'en-AU');assert.equal(rows[0].employer,'Agency & Training');assert.equal(rows[0].closes_at,'2026-11-11T13:59:59.000Z');assert.ok(!JSON.stringify(rows).includes('PRIVATE'));
 for(const title of ['Child Safety Officer','Clinical Nurse','Patient Safety Officer'])assert.deepEqual(parseQueensland(qld.replace('Senior Electrical Safety Inspector',title)),[]);
 assert.throws(()=>parseQueensland('<h1>Bot check</h1>'),/invalid_data/);
 assert.throws(()=>parseQueensland(qld.replace('/jobs/QLD-123','https://evil.test/jobs/QLD-123')),/invalid_data/);
 assert.throws(()=>parseQueensland(qld.replace('2026-11-11','2026-02-30')),/invalid_data/);
});
test('Spain keeps regional source and expiry, respects Madrid DST and future application openings',()=>{
 const rows=parseCastillaLeon(es,new Date('2026-11-03T00:00:00Z'));assert.equal(rows[0].locale,'es-ES');assert.equal(rows[0].closes_at,'2026-11-03T23:00:00.000Z');assert.equal(rows[0].location,'Castilla y León');assert.ok(!JSON.stringify(rows).includes('PRIVATE'));
 assert.equal(madridDeadline('2026-03-29'),'2026-03-29T22:00:00.000Z');assert.equal(madridDeadline('2026-10-25'),'2026-10-25T23:00:00.000Z');assert.throws(()=>madridDeadline('2026-02-30'));
 assert.deepEqual(parseCastillaLeon(es,new Date('2026-09-30T12:00:00Z')),[]);
 assert.throws(()=>parseCastillaLeon({...es,results:[{...es.results[0],enlace_al_contenido:'https://evil.test'}]}));
});
test('Russia does not invent a closing date from hireDate or copy contact data',()=>{
 const rows=parseTrudvsem(ru);assert.equal(rows.length,1);assert.equal(rows[0].closes_at,null);assert.equal(rows[0].deadline_text,'');assert.equal(rows[0].locale,'ru-RU');assert.ok(!JSON.stringify(rows).includes('PRIVATE'));
 assert.throws(()=>parseTrudvsem({...ru,status:'500'}));assert.throws(()=>parseTrudvsem({status:'200',results:{vacancies:[]}}));
 assert.deepEqual(parseTrudvsem({...ru,results:{vacancies:[{vacancy:{...ru.results.vacancies[0].vacancy,'job-name':'Менеджер по продажам'}}]}}),[]);
});
test('new adapters make only bounded official list requests and require no credentials',async()=>{
 for(const [id,response,count,host] of [['qldsmartjobs',qld,1,'smartjobs.qld.gov.au'],['jcyljobs',es,1,'jcyl.opendatasoft.com'],['trudvsem',ru,2,'opendata.trudvsem.ru']]){
  let calls=0;const rows=await collectJobs({id,adapter:id},()=>{throw Error('must not read secrets');},async(url,options)=>{calls++;assert.equal(url.hostname,host);assert.equal(options.redirect,'error');assert.ok(options.signal);return typeof response==='string'?new Response(response):Response.json(response);},new Date('2026-11-03'));
  assert.equal(calls,count);assert.equal(rows.length,1);
 }
 await assert.rejects(collectJobs({id:'qldsmartjobs',adapter:'qldsmartjobs'},()=>null,async()=>new Response('x'.repeat(2*1024*1024+1))),/invalid_data/);
 await assert.rejects(collectJobs({id:'unreviewed',adapter:'trudvsem'},()=>null),/source_error/);
});
test('initial job HTML includes source, licence and regional scope for reused metadata',()=>{
 const html=renderJobHtml('<html lang="en"><head></head><body><div id="root"></div></body></html>','en-AU',jobQuery(''),{items:[{...parseQueensland(qld)[0],source_id:'qldsmartjobs',source:'Queensland',status:'open'}],sources:[],has_more:false});
 assert.ok(html.includes('© The State of Queensland'));assert.ok(html.includes('CC BY 4.0'));assert.ok(html.includes('Queensland public-sector roles only'));assert.ok(!html.includes('PRIVATE'));
});
