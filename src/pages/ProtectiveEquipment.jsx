import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import ThemeSwitcher from '../components/ThemeSwitcher';
import PpeProductBrowser from '../components/PpeProductBrowser';
import { LanguageLink } from '../hooks/useLanguage';
import { PPE_GROUPS, normalizePpeGroup } from '../data/ppeGroups.js';
import { getPpeGuideUi } from '../locales/ppeGuideUi.js';
import './ProtectiveEquipment.css';

export default function ProtectiveEquipment() {
 const {t}=useTranslation('ppe');
 const locale=useLocation().pathname.split('/')[1],ui=getPpeGuideUi(locale);
 const [params,setParams]=useSearchParams(),group=normalizePpeGroup(params.get('category'));
 const [menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{
  if(!menuOpen)return;
  const close=event=>{if(event.key==='Escape')setMenuOpen(false);};
  window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);
 },[menuOpen]);
 const choose=value=>{
  const next=new URLSearchParams(params);
  if(value==='all')next.delete('category');else next.set('category',value);
  setParams(next,{preventScrollReset:true});
 };
 const groupLabel=id=>id==='all'?ui.all:t(`section1.types.item${PPE_GROUPS.find(g=>g.id===id).number}.title`);
 const visibleGroups=group==='all'?PPE_GROUPS:PPE_GROUPS.filter(g=>g.id===group);
 return <div className="ppe-page" dir={locale?.startsWith('ar')?'rtl':'ltr'}>
  <SEO/>
  <header className="ppe-header ppe-container">
   <LanguageLink className="ppe-logo" to="/">Smart JSA Bridge</LanguageLink>
   <div className="ppe-header-actions"><ThemeSwitcher compact/><button type="button" className="ppe-menu-button" aria-expanded={menuOpen} aria-controls="ppe-navigation" onClick={()=>setMenuOpen(value=>!value)}>{menuOpen?ui.closeMenu:ui.openMenu}</button></div>
  </header>
  <nav id="ppe-navigation" className="ppe-navigation ppe-container" hidden={!menuOpen} aria-label={ui.openMenu}>
   {[['/regulation','regulation'],['/jrajsa','jrajsa'],['/protectiveequipment','ppe'],['/riskclassification','riskClass']].map(([to,key])=><LanguageLink key={key} to={to} onClick={()=>setMenuOpen(false)}>{t('nav.'+key)}</LanguageLink>)}
  </nav>
  <main>
   <section className="ppe-hero"><div className="ppe-container">
    <span className="ppe-eyebrow">{t('hero.tag')}</span>
    <h1>{t('hero.title1')} {t('hero.title2')}</h1>
    <p>{t('hero.subTitle1')} {t('hero.subTitle2')} {t('hero.subTitle3')}</p>
   </div></section>
   <div className="ppe-container ppe-content">
    <div className="ppe-filter-area"><h2 id="ppe-filter-title">{ui.filter}</h2><p>{ui.hint}</p>
     <div className="ppe-filters" role="group" aria-labelledby="ppe-filter-title">
      {['all',...PPE_GROUPS.map(g=>g.id)].map(id=><button key={id} type="button" aria-pressed={group===id} onClick={()=>choose(id)}>{groupLabel(id)}</button>)}
     </div>
    </div>
    <section className="ppe-guidance" aria-labelledby="ppe-guidance-title">
     <h2 id="ppe-guidance-title">{t('section1.title')}</h2>
     <div className={'ppe-type-grid'+(group!=='all'?' ppe-type-grid--selected':'')}>
      {visibleGroups.map(({id,number})=>{
       const prefix=`section1.types.item${number}`,tags=t(prefix+'.tags',{returnObjects:true});
       return <article className="ppe-type-card" key={id}><span className="ppe-type-number">{t(prefix+'.num')}</span><h3>{t(prefix+'.title')}</h3><p>{t(prefix+'.desc')}</p>
        <ul className="ppe-tags">{Array.isArray(tags)&&tags.map(tag=><li key={tag}>{tag}</li>)}</ul></article>;
      })}
     </div>
    </section>
    <PpeProductBrowser locale={locale} group={group} label={groupLabel(group)}/>
    <section className="ppe-faq" aria-labelledby="ppe-faq-title"><h2 id="ppe-faq-title">{t('section3.title')}</h2>
     <div className="ppe-faq-grid">{[1,2,3,4].map(number=><article key={number}><h3>{t(`section3.faq.item${number}.q`)}</h3><p>{t(`section3.faq.item${number}.a`)}</p></article>)}</div>
    </section>
   </div>
  </main>
  <footer className="ppe-footer"><div className="ppe-container" dangerouslySetInnerHTML={{__html:t('footer')}}/></footer>
 </div>;
}
