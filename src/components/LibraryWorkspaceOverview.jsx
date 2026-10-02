import {useTranslation} from 'react-i18next';
import {LanguageLink} from '../hooks/useLanguage';
import ProjectStorageUsage from './ProjectStorageUsage';
import {getWorkspaceNavUi} from '../locales/workspaceNavUi';
import '../styles/library-workspace.css';

function WorkspaceIcon({team}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {team ? <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/></> : <><path d="M8 3h8l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M16 3v5h4M4 7H3v13M11 12h5m-5 4h5"/></>}
  </svg>;
}

export default function LibraryWorkspaceOverview({refreshKey}) {
  const {i18n}=useTranslation(),ui=getWorkspaceNavUi(i18n.language);
  return <section className="library-overview" aria-label={ui.workspace} dir={i18n.dir()}>
    <ProjectStorageUsage refreshKey={refreshKey} variant="overview"/>
    <LanguageLink to="/work-packages" className="library-workspace-link">
      <span className="library-workspace-icon"><WorkspaceIcon/></span>
      <span className="library-workspace-copy"><strong>{ui.packages}</strong><span>{ui.packagesDescription}</span><span className="library-workspace-cta">{ui.openPackages}<span aria-hidden="true">→</span></span></span>
    </LanguageLink>
    <LanguageLink to="/business" className="library-workspace-link">
      <span className="library-workspace-icon"><WorkspaceIcon team/></span>
      <span className="library-workspace-copy"><strong>Community / Professional</strong><span>{ui.plansDescription}</span><span className="library-workspace-cta">{ui.openPlans}<span aria-hidden="true">→</span></span></span>
    </LanguageLink>
  </section>;
}
