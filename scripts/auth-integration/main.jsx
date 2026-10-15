import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import i18n from '../../src/i18n';
import Analysis from '../../src/pages/Analysis';
import DocumentDesigner from '../../src/pages/DocumentDesigner';
import { supabase } from './client';
import { fixtureText } from '../analysis-fixture/text';
import '../../src/index.css';

const params = new URLSearchParams(location.search), locale = params.get('locale') || 'en-US';
await i18n.changeLanguage(locale);
localStorage.setItem('jsa_isFastTrack', 'false');
const words = fixtureText[locale.split('-')[0]];
const procedures = [{ stepTitle: words[0], stepDetail: words[0] }];
const state = params.has('restore') ? undefined : {
  formData: { projectName: `Authenticated ${locale}`, jsaType: '3-step',
    context: { documentLocale: locale, jurisdiction: 'US' } },
  procedures, participants: ['Synthetic worker'],
  analysisData: procedures.map((proc, id) => ({ id, proc, risks: [], frequency: null, severity: null, riskLevel: null })),
};
// Surface failed session recovery instead of silently presenting the login form.
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError) throw sessionError;
const { data: { user }, error: userError } = session
  ? await supabase.auth.getUser() : { data: { user: null } };
if (userError) throw userError;
function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(user));
  const [error, setError] = useState('');
  if (!authenticated) return <form onSubmit={async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') });
    if (result.error) setError(result.error.message); else setAuthenticated(true);
  }}>
    <label>Email<input name="email" type="email" required /></label>
    <label>Password<input name="password" type="password" required /></label>
    <button type="submit">Sign in to isolated fixture</button><p role="alert">{error}</p>
  </form>;
  return <HelmetProvider><MemoryRouter initialEntries={[{ pathname: `/${locale}/analysis`, state }]}>
    <Routes><Route path="/:locale/analysis" element={<Analysis />} />
      <Route path="/:locale/document-designer" element={<DocumentDesigner />} /></Routes>
  </MemoryRouter></HelmetProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
