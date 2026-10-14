import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import i18n from '../../src/i18n';
import Analysis from '../../src/pages/Analysis';
import DocumentContent from '../../src/components/DocumentContent';
import { defaultColumns } from '../../src/utils/documentLayout';
import { fixtureText } from './text';
import '../../src/index.css';

const params = new URLSearchParams(location.search), locale = params.get('locale') || 'en-US';
await i18n.changeLanguage(locale);
const words = fixtureText[locale.split('-')[0]];
localStorage.setItem('jsa_isFastTrack', 'false');
const procedures = [{ stepTitle: words[0], stepDetail: words[0] }];
const state = { formData: { projectName: 'Regression fixture', jsaType: '3-step',
  ppe: ['귀마개', '방진복'], permits: ['일반', '가연성가스'], context: { documentLocale: locale, jurisdiction: 'US' } }, procedures,
  analysisData: procedures.map((proc, id) => ({ id, proc, risks: [], frequency: null, severity: null, riskLevel: null })) };
function Output() {
  const data = useLocation().state;
  return <div data-document-ready style={{ width: '1050px', padding: '20px', background: 'white' }}>
    <DocumentContent {...data} documentLocale={data.formData.context.documentLocale}
      layout={{ savedActiveOrder: defaultColumns('3-step'), docTitle: 'Regression fixture' }} />
  </div>;
}
createRoot(document.getElementById('root')).render(
  <HelmetProvider><MemoryRouter initialEntries={[{ pathname: `/${locale}/analysis`, state: params.has('restore') ? undefined : state }]}>
    <Routes><Route path="/:locale/analysis" element={<Analysis />} /><Route path="/:locale/document-designer" element={<Output />} /></Routes>
  </MemoryRouter></HelmetProvider>
);
