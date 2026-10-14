import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import i18n from '../../src/i18n';
import Analysis from '../../src/pages/Analysis';

await i18n.changeLanguage('en-US');
localStorage.setItem('jsa_isFastTrack', 'false');
const procedures = [{ stepTitle: 'Pressure line work', stepDetail: 'Inspect the pressure boundary' },
  { stepTitle: 'Next pressure task', stepDetail: 'Prepare another line' }];
const state = { formData: { projectName: 'Regression fixture', jsaType: '3-step',
  context: { documentLocale: 'en-US', jurisdiction: 'US' } }, procedures,
  analysisData: procedures.map((proc, id) => ({ id, proc, risks: [], frequency: 1, severity: 1, riskLevel: 1 })) };
createRoot(document.getElementById('root')).render(
  <HelmetProvider><MemoryRouter initialEntries={[{ pathname: '/en-US/analysis', state }]}><Analysis /></MemoryRouter></HelmetProvider>
);
