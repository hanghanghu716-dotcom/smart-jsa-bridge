import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminJobs } from '../services/jobService';
import { jobUi } from '../locales/jobUi';
import { LanguageLink } from '../hooks/useLanguage';
import PublicSiteHeader from '../components/PublicSiteHeader';
import SEO from '../components/SEO';
import '../styles/resource-hub.css';
export default function JobAdmin(){
 const {i18n}=useTranslation(),ui=jobUi(i18n.language),ko=i18n.language==='ko',t=(a,b)=>ko?a:b;
 const [data,setData]=useState(null),[page,setPage]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=()=>adminJobs('list','',{page}).then(setData);
 useEffect(()=>{load().catch(()=>setMessage(ui.error));},[page]);
 const run=async(action,id,payload={})=>{if(busy)return;setBusy(true);setMessage('');try{await adminJobs(action,id,payload);await load();setMessage(t('반영했습니다.','Saved.'));}catch{setMessage(ui.error);}finally{setBusy(false);}};
 return <div className="resource-hub" dir={i18n.dir()}><SEO noIndex/><PublicSiteHeader/><main><h1>{ui.admin}</h1><LanguageLink to="/jobs">{ui.title} →</LanguageLink>
 <p>{t('정부 출처 등록과 재게시 허가는 다릅니다. 출처별 승인과 서버 인증키 연결을 마친 뒤에만 자동수집을 활성화합니다. 현재 준비된 연결은 고용24·USAJOBS이며, 다른 출처는 조사 후보입니다. 비밀번호나 API 키를 이 화면에 입력하지 마세요.','A registered government source is not permission to republish. Activate collection only after publication approval and server credential setup. Work24 and USAJOBS adapters are prepared; other sources are research candidates. Do not enter passwords or API keys here.')}</p>
 <p>{t('모집 기한은 조회 시점에 판단하므로 별도 삭제 작업 없이 마감 목록으로 이동합니다. 48시간 동안 모집 여부가 갱신되지 않은 공고는 확인 필요로 분류합니다. 노출 중단한 공고는 다시 수집되어도 복구되지 않습니다.','Deadlines are evaluated when listings are read. Expired listings move to the closed view without a deletion job. Listings not refreshed for 48 hours need an availability check. Withdrawn listings stay hidden after later imports.')}</p>
 {message&&<p role="status">{message}</p>}
 <section className="resource-admin-panel"><h2>{ui.sources}</h2>{data?.sources.map(s=><details key={s.id}><summary>{s.name} · {s.locales.join(', ')} · {s.enabled?'ON':'OFF'}</summary>
 <p>{ko?s.requirement:t('','Publication and access approval required; no automatic collection is enabled by source registration.')}</p>
 <p>{s.collection_status||t('아직 수집 전','Not collected')} · {s.last_success_at||''}</p>
 {s.policy_url&&<a href={s.policy_url} target="_blank" rel="noopener noreferrer">{t('공식 제공 조건 확인','Official access / publication terms')} ↗</a>}
 {s.enabled&&<button type="button" disabled={busy} onClick={()=>run('suspend_source',s.id)}>{t('이 출처 노출·수집 중단','Suspend source and collection')}</button>}
 {s.adapter?<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);run('approve_source',s.id,{evidence:f.get('evidence'),note:f.get('note'),checks:Object.fromEntries(['publication','commercial','scope','account'].map(k=>[k,f.has(k)]))});}}>
 <label>{t('이 서비스에 대한 게시 허가 근거 URL','Evidence URL for this service’s publication permission')}<input required type="url" name="evidence" defaultValue={s.evidence_url}/></label>
 <label>{t('허용 범위·조건·검토 내용','Permitted scope, conditions and review notes')}<textarea required minLength={12} maxLength={2000} name="note" defaultValue={s.review_note}/></label>
 {[["publication",t('제목·회사·근무지·마감일·원문 링크 게시 허가 확인','Permission to publish title, employer, location, deadline and original link verified')],["commercial",t('광고 운영 서비스에서의 이용 조건 확인','Use on an advertising-supported service verified')],["scope",t('안전·현장 직무와 국가·지역 범위 확인','Safety / field job and jurisdiction scope verified')],["account",t('API 승인 계정·서버 인증키 및 실행 일정 준비 확인','API account approval, server credentials and collection schedule ready')]].map(([k,label])=><label className="resource-check" key={k}><input required name={k} type="checkbox"/>{label}</label>)}
 <button disabled={busy}>{t('검토 저장·90일 게시 허용','Save review / allow publication for 90 days')}</button></form>:<p>{t('연결 방식·게시 조건 확인 후 추가할 수 있습니다.','Can be connected after the official access method and publication terms are verified.')}</p>}</details>)}</section>
 <section className="resource-admin-panel"><h2>{ui.title}</h2>{data?.items.map(i=><article key={i.id}><h3 dir="auto">{i.title}</h3><p>{i.locale} · {ui[i.status]||i.status} · {i.deadline_text}</p><button disabled={busy} onClick={()=>run(i.withdrawn_at?'restore':'withdraw',i.id)}>{i.withdrawn_at?t('복구','Restore'):t('노출 중단','Hide listing')}</button></article>)}
 <nav className="resource-pages">{page>0&&<button onClick={()=>setPage(n=>n-1)}>{ui.previous}</button>}<span>{page+1}</span>{data?.has_more&&<button onClick={()=>setPage(n=>n+1)}>{ui.next}</button>}</nav></section>
 </main></div>;
}
