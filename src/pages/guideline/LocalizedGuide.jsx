import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEO from '../../components/SEO';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import DiscoveryLinks from '../../components/DiscoveryLinks';
import { LANGUAGE_OPTIONS, SUPPORTED_LANGS } from '../../locales/config.js';
import { guideText } from '../../locales/guideText.js';
import { GUIDE_CATEGORIES, guideResourceLocale, makeGuide } from '../../utils/guideContent.js';
import '../../styles/workspaces.css';
import '../../styles/guides.css';

const resources=import.meta.glob('../../locales/*/{common,const,manu,chem,highrisk,general}.json',{eager:true,import:'default'});
export default function LocalizedGuide({category}){
 const {lng}=useParams();
 const locale=SUPPORTED_LANGS.includes(lng)?lng:'en-US';
 const resource=resources[`../../locales/${guideResourceLocale(locale)}/${GUIDE_CATEGORIES[category]}.json`];
 const guide=makeGuide(locale,category,resource),t=key=>guideText(locale,key);
 const [preview,setPreview]=useState(false),[pdfState,setPdfState]=useState('idle');
 useEffect(()=>{setPreview(false);setPdfState('idle');},[locale,category]);
 useEffect(()=>{
  if(!preview)return;
  const controller=new AbortController();
  setPdfState('loading');
  fetch(guide.pdfUrl,{method:'HEAD',signal:controller.signal}).then(r=>{
   setPdfState(r.ok&&r.headers.get('content-type')?.includes('application/pdf')?'ready':'error');
  }).catch(e=>{if(e.name!=='AbortError')setPdfState('error');});
  return ()=>controller.abort();
 },[preview,guide.pdfUrl]);
 const links=['local','workflow','examples','records','sources'];
 const structured={
  '@context':'https://schema.org','@type':'Article','@id':`${guide.url}#article`,headline:guide.title,description:guide.description,
  inLanguage:guide.language,dateModified:guide.version,mainEntityOfPage:guide.url,
  author:{'@type':'Organization',name:'Smart JSA Bridge',url:'https://smartjsabridge.com'},
  publisher:{'@type':'Organization',name:'Smart JSA Bridge'},
  spatialCoverage:{'@type':'Place',name:guide.region},citation:guide.sources.map(s=>s.url),
  encoding:{'@type':'MediaObject',encodingFormat:'application/pdf',contentUrl:`https://smartjsabridge.com${guide.pdfUrl}`,inLanguage:guide.language},
 };
 return <div className="jsa-workspace guide-page" dir={guide.language.startsWith('ar')?'rtl':'ltr'} data-guide-locale={locale} data-guide-category={category}>
  <SEO pageTitle={`${guide.title} · ${guide.region} | Smart JSA Bridge`} pageDescription={guide.description} canonicalLocale={locale} availableLocales={SUPPORTED_LANGS}/>
  <Helmet><script type="application/ld+json">{JSON.stringify(structured).replace(/</g,'\\u003c')}</script></Helmet>
  <header className="jsa-nav guide-screen"><Link to={`/${locale}/`}>SMART JSA BRIDGE</Link><div className="guide-nav-actions"><Link to={`/${locale}/explore`}>{t('explore')}</Link><ThemeSwitcher compact/></div></header>
  <main className="guide-container">
   <div className="guide-topbar guide-screen"><nav aria-label={t('library')}><Link to={`/${locale}/guideline/common`}>{t('library')}</Link><span aria-hidden="true"> / </span><span>{t(category)}</span></nav>
    <label>{t('region')}<select aria-label={t('region')} value={locale} onChange={event=>{window.location.assign(`/${event.target.value}/guideline/${category}`);}}>{[...LANGUAGE_OPTIONS,{code:'en-CA',label:'English (Canada)'}].map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
   </div>
   <div className="guide-layout">
    <aside className="guide-toc guide-screen"><p>{t('contents')}</p><nav>{links.map((key,index)=><a href={`#guide-${key}`} key={key}><span>{String(index+1).padStart(2,'0')}</span>{t(key)}</a>)}</nav><div className="guide-toc-note">{guide.region}<br/>{guide.version}</div></aside>
    <article id="guide-document" data-guide-version={guide.version} lang={guide.language}>
     <header className="guide-hero"><span className="guide-kicker">{t('library')} / {guide.region}</span><h1>{guide.title}</h1><p className="guide-lead">{t('intro')}</p><div className="guide-meta"><span>{t('editorial')}</span><span>{t('edition')} <time dateTime={guide.version}>{guide.version}</time></span></div>
      <div className="guide-actions guide-screen"><a className="jsa-primary" href={guide.pdfUrl} download>{t('download')} <span aria-hidden="true">↓</span></a><button type="button" aria-expanded={preview} aria-controls="guide-pdf-preview" onClick={()=>setPreview(v=>!v)}>{t(preview?'close':'preview')}</button><a href="#guide-examples">{t('read')} →</a></div>
      <p className="guide-pdf-help guide-screen">{t('pdfHelp')}</p>
      {preview&&<div id="guide-pdf-preview" className="guide-pdf guide-screen">{pdfState==='loading'&&<p role="status">{t('loading')}</p>}{pdfState==='error'&&<p role="alert">{t('pdfUnavailable')}</p>}{pdfState==='ready'&&<iframe src={guide.pdfUrl} title={`${t('pdfLabel')} · ${guide.region}`} loading="lazy"/>}</div>}
     </header>
     <section id="guide-local" className="guide-section guide-local"><div className="guide-section-heading"><span>01</span><h2>{t('local')}</h2></div><p>{guide.localNote}</p><ul className="guide-documents">{guide.documents.map(d=><li key={d}>{d}</li>)}</ul><p className="guide-scope">{t('scope')}</p></section>
     <section id="guide-workflow" className="guide-section"><div className="guide-section-heading"><span>02</span><h2>{t('workflow')}</h2></div><ol className="guide-workflow">{guide.workflow.map((step,i)=><li key={step.title}><span className="guide-step-number">{i+1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol></section>
     <section id="guide-examples" className="guide-section"><div className="guide-section-heading"><span>03</span><h2>{t('examples')} <small>{guide.examples.length}</small></h2></div><div className="guide-example-list">{guide.examples.map(item=><section className="guide-example" id={item.id} key={item.id}><div className="guide-example-title"><span>{item.id}</span><h3>{item.title}</h3></div><dl><dt>{t('hazard')}</dt><dd>{item.hazard}</dd><dt>{t('checks')}</dt><dd><ul>{item.checks.map(check=><li key={check}>{check}</li>)}</ul></dd></dl></section>)}</div></section>
     <section id="guide-records" className="guide-section guide-records"><div className="guide-section-heading"><span>04</span><h2>{t('records')}</h2></div><p>{t('recordsBody')}</p><div className="guide-actions guide-screen"><Link className="jsa-primary" to={`/${locale}/info`}>{t('create')} →</Link><Link to={`/${locale}/work-packages`}>{t('package')} →</Link></div></section>
     <section id="guide-sources" className="guide-section guide-sources"><div className="guide-section-heading"><span>05</span><h2>{t('sources')}</h2></div><p>{t('referenceHelp')}</p><ul>{guide.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul><p className="guide-print-only">{guide.url}</p></section>
    </article>
   </div>
   <section className="guide-related guide-screen"><h2>{t('related')}</h2><nav>{Object.keys(GUIDE_CATEGORIES).filter(c=>c!==category).map(c=><Link key={c} to={`/${locale}/guideline/${c}`}>{t(c)} <span aria-hidden="true">↗</span></Link>)}</nav><DiscoveryLinks kind="guide" target={category}/></section>
  </main>
  <footer className="guide-footer guide-screen">© Smart JSA Bridge <Link to={`/${locale}/explore`}>{t('explore')}</Link></footer>
 </div>;
}
