import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';
import { jsaTemplateUi } from '../locales/jsaTemplateUi';
import DraftDocumentPreview from './DraftDocumentPreview';
import '../styles/jsa-authoring.css';
export default function AuthoringWorkspace({ children, snapshot }) {
 const [view,setView]=useState('input'), {i18n}=useTranslation(), ui=jsaTemplateUi(i18n.language);
 const navigate=useLanguageNavigate(), location=useLocation();
 const route='/'+location.pathname.split('/').slice(2).join('/');
 return <div className="authoring-workspace" data-view={view}>
  <div className="authoring-mobile-tabs" role="group" aria-label={ui.preview}>
   <button type="button" aria-pressed={view==='input'} onClick={()=>setView('input')}>{ui.input}</button>
   <button type="button" aria-pressed={view==='preview'} onClick={()=>setView('preview')}>{ui.preview}</button>
  </div>
  <div className="authoring-grid">{children}<DraftDocumentPreview snapshot={snapshot} onChangeTemplate={()=>navigate('/templates',{state:{...snapshot,templateReturnTo:route}})}/></div>
 </div>;
}
