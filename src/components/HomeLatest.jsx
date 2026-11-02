import {useEffect,useState} from 'react';
import {LanguageLink} from '../hooks/useLanguage';
import {resourceCall} from '../services/resourceHubService';
import {latestUi} from '../locales/latestUi';
import {jobUi} from '../locales/jobUi';
import {resourceHubUi} from '../locales/resourceHubUi';
import {isStaticContentBuild} from '../utils/caseListBootstrap';
import {jobStatus} from '../utils/jobs';
import KoreanSourceLinks from './KoreanSourceLinks';
import '../styles/home-latest.css';

export default function HomeLatest({locale}){
 const ui=latestUi(locale),jobsUi=jobUi(locale),resourcesUi=resourceHubUi(locale);
 const [state,setState]=useState(null),[retry,setRetry]=useState(0),[now,setNow]=useState(Date.now());
 useEffect(()=>{
  if(isStaticContentBuild())return;
  let active=true;
  resourceCall('resource_home',{p_locale:locale}).then(data=>{if(active){setNow(Date.now());setState({locale,data});}}).catch(()=>{if(active)setState({locale,error:true});});
  return()=>{active=false;};
 },[locale,retry]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const data=state?.locale===locale?state.data:null,error=state?.locale===locale&&state.error;
 return <div className="home-latest" data-home-latest>
  {['news','jobs'].map(kind=><section key={kind} aria-labelledby={'latest-'+kind}>
   <header><h2 id={'latest-'+kind}>{ui[kind]}</h2><LanguageLink to={kind==='news'?'/resources?kind=news':'/jobs'}>{ui.all} <span aria-hidden="true">→</span></LanguageLink></header>
   {error?<p role="status">{resourcesUi.error} <button onClick={()=>setRetry(n=>n+1)}>↻</button></p>:!data?<p role="status">{resourcesUi.loading}</p>:<>
    <ul>{(data[kind]||[]).filter(i=>kind!=='jobs'||jobStatus(i,now)==='open').slice(0,4).map(item=><li key={item.id}>
     <p className="home-latest-meta">{kind==='news'?item.source:item.employer}{kind==='news'&&item.source_date&&<> · <time dateTime={item.source_date}>{item.source_date}</time></>}</p>
     <h3 dir="auto"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}<span aria-hidden="true"> ↗</span></a></h3>
     {kind==='jobs'?<p className="home-latest-detail" dir="auto">{item.location}{item.deadline_text&&<> · {jobsUi.deadline}: {item.deadline_text}</>}</p>:<>
      {item.automatic&&<small>{ui.automatic}</small>}
      {item.attribution&&<small dir="auto">{item.attribution}</small>}
     </>}
    </li>)}</ul>
    {!(data[kind]||[]).some(i=>kind!=='jobs'||jobStatus(i,now)==='open')&&<><p className="home-latest-empty">{kind==='news'?ui.newsEmpty:data.jobs_connected?jobsUi.empty:ui.jobsEmpty}</p>{locale==='ko'&&<KoreanSourceLinks kind={kind}/>}</>}
   </>}
  </section>)}
 </div>;
}
