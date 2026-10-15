import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import i18n from '../../src/i18n';
import Analysis from '../../src/pages/Analysis';
import DocumentDesigner from '../../src/pages/DocumentDesigner';
import Export from '../../src/pages/Export';
import Info from '../../src/pages/Info';
import Procedure from '../../src/pages/Procedure';
import RegionalStartActions from '../../src/components/RegionalStartActions';
import { fixtureCasePost } from './casePost';
import { defaultColumns } from '../../src/utils/documentLayout';
import { fixtureText } from './text';
import '../../src/index.css';

const params = new URLSearchParams(location.search), locale = params.get('locale') || 'en-US';
const uiLocale = params.get('uiLocale') || locale;
await i18n.changeLanguage(uiLocale);
const words = fixtureText[locale.split('-')[0]];
localStorage.setItem('jsa_isFastTrack', 'false');
const procedures = [{ stepTitle: words[0], stepDetail: words[0] }];
const state = { formData: { projectName: 'Regression fixture', jsaType: '3-step',
  ppe: ['귀마개', '방진복'], permits: ['일반', '가연성가스'], context: { documentLocale: locale, jurisdiction: 'US' } }, procedures,
  analysisData: procedures.map((proc, id) => ({ id, proc, risks: [], frequency: null, severity: null, riskLevel: null })) };
const draft = params.has('legacy') ? JSON.parse(localStorage.getItem('smartjsa_guest_draft:' + sessionStorage.getItem('smartjsa_active_draft_id'))) : null;
const initialState = draft ? { formData: draft.form_data, analysisData: draft.analysis_data, procedures: draft.procedures,
  savedActiveOrder: defaultColumns('3-step'), documentBlocks: [], docTitle: 'Regression fixture' } : params.has('restore') ? undefined : state;
createRoot(document.getElementById('root')).render(
  <HelmetProvider><MemoryRouter initialEntries={[{ pathname: `/${uiLocale}/${params.has('case') ? 'case-start' : draft ? 'export' : 'analysis'}`, state: initialState }]}>
    <Routes><Route path="/:locale/case-start" element={<RegionalStartActions locale={locale} activity={fixtureCasePost(locale).title} casePost={fixtureCasePost(locale)} />} />
      <Route path="/:locale/info" element={<Info />} /><Route path="/:locale/procedure" element={<Procedure />} />
      <Route path="/:locale/analysis" element={<Analysis />} /><Route path="/:locale/document-designer" element={<DocumentDesigner />} /><Route path="/:locale/export" element={<Export />} /></Routes>
  </MemoryRouter></HelmetProvider>
);
