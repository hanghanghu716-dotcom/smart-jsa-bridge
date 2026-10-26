import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';
import useJsaDraftRecovery from '../hooks/useJsaDraftRecovery';
import useJsaDraftAutosave from '../hooks/useJsaDraftAutosave';
import DraftSaveStatus from '../components/DraftSaveStatus';
import ThemeSwitcher from '../components/ThemeSwitcher';
import SEO from '../components/SEO';
import AuthoringSteps from '../components/AuthoringSteps';
import DraftDocumentPreview from '../components/DraftDocumentPreview';
import DocumentContent from '../components/DocumentContent';
import { JSA_TEMPLATES, AUTHORING_ROUTES, authoringSnapshot, builtInTemplate, draftDocumentLayout } from '../utils/jsaTemplates';
import { pickDocumentLayout } from '../utils/documentLayout';
import { paperPreviewWidth, paperDimensions } from '../utils/paperFormat';
import { jsaTemplateUi } from '../locales/jsaTemplateUi';
import '../styles/jsa-authoring.css';
function Miniature({snapshot}) {
 const {i18n}=useTranslation(), layout=draftDocumentLayout(snapshot,i18n), locale=snapshot.formData?.context?.documentLocale || i18n.language;
 const width=paperPreviewWidth(layout.paperSize,layout.savedOrientation), dim=paperDimensions(layout.paperSize,layout.savedOrientation);
 return <div className="template-miniature" aria-hidden="true"><div className="authoring-report theme-paper" style={{width,minHeight:width*dim.height/dim.width,zoom:.22}}>
  <DocumentContent documentLocale={locale} formData={{jsaType:snapshot.formData?.jsaType}} participants={[]} analysisData={[{proc:{},risks:[]},{proc:{},risks:[]},{proc:{},risks:[]}]} layout={layout}/>
 </div></div>;
}
export default function DocumentTemplates(){
 const location=useLocation(),{i18n}=useTranslation(),ui=jsaTemplateUi(i18n.language);
 const recover=!location.state?.formData,{draft,status}=useJsaDraftRecovery(recover);
 if(recover&&!['ready','empty','error'].includes(status))return <p role="status">{ui.loading}</p>;
 if(recover&&status==='error')return <p role="alert">{ui.error}</p>;
 return <TemplatePicker key={location.key} recoveredDraft={draft}/>;
}
function TemplatePicker({recoveredDraft}){
 const location=useLocation(),navigate=useLanguageNavigate(),{i18n}=useTranslation(),ui=jsaTemplateUi(i18n.language);
 const initial=authoringSnapshot(location.state,recoveredDraft);
 const hadLayout=Boolean(initial.documentBlocks?.length||initial.savedActiveOrder?.length);
 const [snapshot,setSnapshot]=useState(()=>hadLayout?initial:builtInTemplate('standard',initial,i18n));
 const [selected,setSelected]=useState(()=>hadLayout?'current':'standard'),[saving,setSaving]=useState(false),[failed,setFailed]=useState(false);
 const draftSave=useJsaDraftAutosave({stage:'info',formData:snapshot.formData,participants:snapshot.participants,procedures:snapshot.procedures,
  analysisData:snapshot.analysisData,layoutData:pickDocumentLayout(snapshot),sourceProjectId:snapshot.parentId||snapshot.existingId||null});
 const select=id=>{setSelected(id);setSnapshot(id==='current'?initial:builtInTemplate(id,snapshot,i18n));};
 const proceed=async customize=>{
  setSaving(true);setFailed(false);
  try{
   await draftSave.flushAndPause();
   const state={...snapshot,templateId:snapshot.templateId||'custom'};
   if(customize)navigate('/document-designer',{state:{...state,designerReturnTo:'/templates'}});
   else navigate(AUTHORING_ROUTES.slice(1).includes(snapshot.templateReturnTo)?snapshot.templateReturnTo:'/info',{state});
  }catch{setFailed(true);draftSave.resume();setSaving(false);}
 };
 return <div className="theme-workspace template-page" dir={i18n.dir()}>
  <SEO noIndex/><header className="template-header"><button type="button" onClick={()=>navigate('/')}>Smart JSA Bridge</button><ThemeSwitcher compact/></header>
  <main className="template-main">
   <AuthoringSteps current={0}/><h1>{ui.title}</h1><p className="template-intro">{ui.intro}</p>
   <div className="template-workspace"><section className="template-selection">
    {!hadLayout&&!snapshot.analysisData?.some(step=>step.risks?.length)&&<label className="template-type">{ui.type}<select value={snapshot.formData.jsaType||'2-step'} onChange={event=>{
     const next={...snapshot,formData:{...snapshot.formData,jsaType:event.target.value}};
     setSnapshot(selected==='current'?next:builtInTemplate(selected,next,i18n));
    }}><option value="2-step">{ui.types[0]}</option><option value="3-step">{ui.types[1]}</option></select></label>}
    <div className="template-cards">
     {hadLayout&&<button type="button" className="template-card" aria-pressed={selected==='current'} data-template="current" onClick={()=>select('current')}><Miniature snapshot={initial}/><strong>{ui.current}</strong></button>}
     {JSA_TEMPLATES.map((id,index)=><button type="button" className="template-card" key={id} data-template={id} aria-pressed={selected===id} onClick={()=>select(id)}>
      <Miniature snapshot={builtInTemplate(id,snapshot,i18n)}/><span className="template-free">{ui.free}</span><strong>{ui.names[index]}</strong><span>{ui.descriptions[index]}</span>
     </button>)}
    </div>
    <p className="template-hint">{ui.hint}</p>
    <div className="template-actions"><button type="button" data-template-customize disabled={saving} onClick={()=>proceed(true)}>{ui.customize}</button><button type="button" className="template-primary" data-template-continue disabled={saving} onClick={()=>proceed(false)}>{ui.use} →</button></div>
    <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt}/>{failed&&<p role="alert">{ui.error}</p>}
   </section><DraftDocumentPreview snapshot={snapshot}/></div>
  </main>
 </div>;
}
