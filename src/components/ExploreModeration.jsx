import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { exploreModeration } from '../services/exploreModeration';
import { getExploreModerationUi } from '../locales/exploreModerationUi';
import { getSocialUi } from '../locales/socialUi';
import { countryLabel } from '../utils/publicCountry';
import '../styles/explore-moderation.css';

export function ExploreModerationButton({ id, restricted = false, onChanged }) {
  const { i18n } = useTranslation(), ui = getExploreModerationUi(i18n.language), common = getSocialUi(i18n.language);
  const dialog = useRef(null), lock = useRef(false), heading = useId();
  const [snapshot, setSnapshot] = useState(null), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function load() {
    setSnapshot(null); setError('');
    try { setSnapshot(await exploreModeration('inspect', id)); }
    catch { setError(common.error); }
  }
  async function submit(e) {
    e.preventDefault(); if (lock.current || !snapshot || snapshot.id !== id || reason.trim().length < 10) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await exploreModeration(snapshot.restricted ? 'restore' : 'restrict', id, { reason: reason.trim(), version: snapshot.version, updated_at: snapshot.updated_at });
      dialog.current.close(); onChanged?.();
    } catch (failure) {
      setError(/STALE_/.test(failure.message) ? common.conflict : common.error);
      setSnapshot(null);
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="explore-moderation-control">
    <button type="button" data-moderation-open onClick={() => { setReason(''); dialog.current.showModal(); void load(); }}>{restricted ? ui.restore : ui.restrict}</button>
    <dialog ref={dialog} className="explore-moderation-dialog" aria-labelledby={heading} onCancel={e => { if (lock.current) e.preventDefault(); }}>
      <form onSubmit={submit}>
        <h2 id={heading}>{snapshot ? (snapshot.restricted ? ui.restore : ui.restrict) : ui.manage}</h2>
        {snapshot && <p className="moderation-document-title">{snapshot.title}</p>}
        <p>{ui.help}</p>
        <label>{ui.reason}<textarea data-moderation-reason required minLength={10} maxLength={2000} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} /></label>
        {error && <p role="alert">{error} <button type="button" disabled={busy} onClick={load}>{common.refresh}</button></p>}
        {!snapshot && !error && <p role="status">…</p>}
        <div className="jsa-toolbar"><button type="button" disabled={busy} onClick={() => dialog.current.close()}>{ui.cancel}</button><button data-moderation-submit disabled={busy || !snapshot || reason.trim().length < 10}>{busy ? '…' : ui.apply}</button></div>
      </form>
    </dialog>
  </div>;
}

export function RestrictedExploreDocuments({ onChanged, refreshKey = 0 }) {
  const { i18n } = useTranslation(), ui = getExploreModerationUi(i18n.language), common = getSocialUi(i18n.language);
  const [open, setOpen] = useState(false), [input, setInput] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(0), [revision, setRevision] = useState(0);
  const [state, setState] = useState(null), key = JSON.stringify([page,search,revision,refreshKey]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    exploreModeration('restricted', null, { search, offset: page * 25 }).then(rows => {
      if (active) setState({ key, rows });
    }).catch(() => { if (active) setState({ key, error: true }); });
    return () => { active = false; };
  }, [open, key, page, search]);
  const current = state?.key === key ? state : null;
  const refresh = () => { setRevision(n => n + 1); onChanged?.(); };
  return <section className="explore-moderation-panel" aria-label={ui.manage}>
    <button type="button" data-restricted-toggle aria-expanded={open} onClick={() => { setOpen(!open); setRevision(n => n + 1); }}>{ui.restrictedList}</button>
    {open && <><form className="jsa-toolbar" onSubmit={e => { e.preventDefault(); setPage(0); setSearch(input.trim()); setRevision(n => n + 1); }}><label>{ui.search}<input maxLength={200} value={input} onChange={e => setInput(e.target.value)} /></label><button>{ui.search}</button><button type="button" onClick={refresh}>{common.refresh}</button></form>
      {!current && <p role="status">…</p>}{current?.error && <p role="alert">{common.error}</p>}
      {current?.rows?.length === 0 && <p>{common.empty}</p>}
      <ul>{current?.rows?.map(row => <li key={row.id}><div><LanguageLink to={'/public-jsa/' + row.id}>{row.title}</LanguageLink><small>{countryLabel(row.public_country,i18n.language)} · {row.public_locale}</small></div><ExploreModerationButton id={row.id} restricted onChanged={refresh} /></li>)}</ul>
      <div className="jsa-toolbar"><button disabled={!page} onClick={() => setPage(n => n - 1)}>{common.previous}</button><span>{page + 1}</span><button disabled={!current?.rows || current.rows.length < 25} onClick={() => setPage(n => n + 1)}>{common.next}</button></div>
    </>}
  </section>;
}
