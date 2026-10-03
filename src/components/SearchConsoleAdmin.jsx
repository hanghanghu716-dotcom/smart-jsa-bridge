import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { getSearchConsoleUi } from '../locales/searchConsoleUi';
import { getDiscoveryUi } from '../locales/discoveryUi';
import { getLanguageTag } from '../locales/config';

async function request(action = 'dashboard', payload = {}) {
 const { data, error } = await supabase.rpc('search_metrics_admin', { p_action: action, p_payload: payload });
 if (error) throw error;
 return data;
}
export default function SearchConsoleAdmin() {
 const { i18n } = useTranslation(), ui = getSearchConsoleUi(i18n.language), common = getDiscoveryUi(i18n.language);
 const [data, setData] = useState(null), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
 const previous = new Date(); previous.setUTCDate(1); previous.setUTCMonth(previous.getUTCMonth() - 1);
 const [month, setMonth] = useState(previous.toISOString().slice(0, 7)), [clicks, setClicks] = useState(''), [impressions, setImpressions] = useState(''), [source, setSource] = useState('');
 const lock = useRef(false);
 const number = value => value == null ? '—' : new Intl.NumberFormat(getLanguageTag(i18n.language)).format(value);
 const timestamp = value => value ? new Intl.DateTimeFormat(getLanguageTag(i18n.language), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
 useEffect(() => {
  let active = true;
  request().then(result => { if (active) { setData(result); setMessage(''); } }).catch(() => { if (active) setMessage('error'); });
  return () => { active = false; };
 }, [revision]);
 const save = async event => {
  event.preventDefault(); if (lock.current) return;
  lock.current = true; setBusy(true); setMessage('');
  try { await request('naver_month', { month: month + '-01', clicks: Number(clicks), impressions: impressions === '' ? null : Number(impressions), source }); setRevision(n => n + 1); }
  catch { setMessage('error'); }
  finally { lock.current = false; setBusy(false); }
 };
 return <section className="search-console-admin">
  <h3>{ui.title}</h3><p>{ui.help}</p>
  <button disabled={busy} onClick={() => setRevision(n => n + 1)}>{common.refresh}</button>
  {message && <p role="alert">{ui.error}</p>}
  <div className="search-connections">{['google', 'bing'].map(provider => {
   const state = data?.connections?.find(item => item.provider === provider);
   return <article className="jsa-card" key={provider}><h4>{provider === 'google' ? 'Google Search Console' : 'Bing Webmaster Tools'}</h4>
    <p>{state ? (state.status === 'success' ? ui.success : ui.error) : ui.unconfigured}</p>
    {state && <><p>{state.property}</p><p>{ui.lastSuccess}: {timestamp(state.succeeded_at)}</p><p>{ui.attempt}: {timestamp(state.attempted_at)}</p>{state.error_code && <code>{state.error_code}</code>}</>}
    <a href={provider === 'google' ? 'https://search.google.com/search-console' : 'https://www.bing.com/webmasters/'} target="_blank" rel="noopener noreferrer">{provider === 'google' ? 'Search Console' : 'Bing Webmaster Tools'} ↗</a>
   </article>;
  })}</div>
  <div className="discovery-table"><table><caption>{ui.title}</caption><thead><tr>{[common.month, ui.provider, ui.scope, common.search, ui.impressions, 'CTR', ui.range].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>
   {(data?.monthly || []).map(row => <tr key={row.provider + row.scope + row.month}><th scope="row">{row.month.slice(0, 7)}</th><td>{row.provider === 'google' ? 'Google' : 'Bing'}</td><td>{ui[row.scope]}</td><td>{number(row.clicks)}</td><td>{number(row.impressions)}</td><td>{row.impressions ? new Intl.NumberFormat(getLanguageTag(i18n.language), { style: 'percent', maximumFractionDigits: 2 }).format(row.clicks / row.impressions) : '—'}</td><td>{row.first_day} – {row.last_day}</td></tr>)}
   {!data?.monthly?.length && <tr><td colSpan={7}>{ui.empty}</td></tr>}
  </tbody></table></div>
  <details><summary>{ui.manual}</summary><p>{ui.naverHelp}</p><a href="https://searchadvisor.naver.com/" target="_blank" rel="noopener noreferrer">Naver Search Advisor ↗</a>
   <form onSubmit={save}><label>{common.month}<input required type="month" max={previous.toISOString().slice(0, 7)} value={month} onChange={e => setMonth(e.target.value)} /></label><label>{common.search}<input required type="number" min="0" max="1000000000000" step="1" value={clicks} onChange={e => setClicks(e.target.value)} /></label><label>{ui.impressions}<input type="number" min="0" max="1000000000000" step="1" value={impressions} onChange={e => setImpressions(e.target.value)} /></label><label>{ui.source}<input required minLength={5} maxLength={500} value={source} onChange={e => setSource(e.target.value)} /></label><button disabled={busy}>{common.save}</button></form>
   <div className="discovery-table"><table><caption>Naver · {ui.site}</caption><thead><tr>{[common.month, common.search, ui.impressions, ui.source].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{data?.naver?.map(row => <tr key={row.month}><th>{row.month.slice(0, 7)}</th><td>{number(row.clicks)}</td><td>{number(row.impressions)}</td><td>{row.source}</td></tr>)}</tbody></table></div>
  </details>
  {!!data?.legacy?.length && <details><summary>{ui.legacy}</summary><ul>{data.legacy.map(row => <li key={row.month}>{row.month.slice(0, 7)} · {number(row.clicks)} · {row.source}</li>)}</ul></details>}
 </section>;
}
