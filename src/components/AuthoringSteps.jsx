import { useTranslation } from 'react-i18next';
import { jsaTemplateUi } from '../locales/jsaTemplateUi';
import '../styles/jsa-authoring.css';
export default function AuthoringSteps({ current }) {
 const {i18n}=useTranslation(), ui=jsaTemplateUi(i18n.language);
 return <ol className="authoring-steps no-print" aria-label={ui.title}>
  {ui.steps.map((label,index)=><li key={index} aria-current={current===index?'step':undefined} data-complete={index<current}>
   <span aria-hidden="true">{index<current?'✓':index+1}</span><span>{label}</span>
  </li>)}
 </ol>;
}
