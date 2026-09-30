import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listTemplates, writeTemplate, removeTemplate, setDefaultTemplate } from '../services/documentTemplateService';

export default function DocumentTemplateManager({ layout, onApply, allowDefault }) {
  const { t } = useTranslation('common');
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const callbacks = useRef({ onApply, allowDefault });
  const operationPending = useRef(false);
  useEffect(() => { callbacks.current = { onApply, allowDefault }; }, [onApply, allowDefault]);
  const selected = templates.find(item => item.id === selectedId);
  useEffect(() => {
    let active = true;
    listTemplates().then(items => {
      if (!active) return;
      setTemplates(items);
      const defaultItem = items.find(item => item.is_default);
      if (defaultItem && callbacks.current.allowDefault()) {
        callbacks.current.onApply(defaultItem);
        setSelectedId(defaultItem.id); setName(defaultItem.name);
      }
    }).catch(() => { if (active) setError('saveFlow.templateError'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  const perform = async action => {
    if (busy || operationPending.current) return;
    if (['update', 'delete'].includes(action) && !window.confirm(t(action === 'update' ? 'saveFlow.confirmUpdate' : 'saveFlow.confirmDelete'))) return;
    operationPending.current = true;
    setBusy(true); setError('');
    try {
      if (action === 'delete') { await removeTemplate(selectedId); setSelectedId(''); setName(''); }
      else if (action === 'default') await setDefaultTemplate(selected?.is_default ? null : selectedId);
      else {
        const item = await writeTemplate({ id: action === 'new' ? null : selectedId, name, layout: action === 'rename' ? undefined : layout });
        setSelectedId(item.id); setName(item.name);
      }
      setTemplates(await listTemplates());
    } catch { setError('saveFlow.templateError'); }
    finally { operationPending.current = false; setBusy(false); }
  };
  const button = { padding: '7px 9px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' };
  const input = { ...button, width: '100%', margin: '5px 0' };
  return <section data-template-manager>
    <h3>{t('designer.templates')}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{t('saveFlow.templatesHint')}</p>
    {error && <p role="alert" style={{ color: 'var(--danger)' }}>{t(error)}</p>}
    <select aria-label={t('designer.templates')} style={input} value={selectedId} disabled={busy} onChange={event => {
      const item = templates.find(template => template.id === event.target.value);
      setSelectedId(event.target.value); setName(item?.name || '');
      if (item) onApply(item);
    }}>
      <option value="">{t('designer.chooseTemplate')}</option>
      {templates.map(item => <option key={item.id} value={item.id}>{item.is_default ? '★ ' : ''}{item.name}</option>)}
    </select>
    <input style={input} aria-label={t('designer.templateName')} placeholder={t('designer.templateName')} value={name} disabled={busy} onChange={event => setName(event.target.value)} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
      <button style={button} disabled={busy || !name.trim()} onClick={() => perform('new')}>{t('saveFlow.newTemplate')}</button>
      <button style={button} disabled={busy || !selected || !name.trim()} onClick={() => perform('rename')}>{t('saveFlow.rename')}</button>
      <button style={button} disabled={busy || !selected || !name.trim()} onClick={() => perform('update')}>{t('saveFlow.updateTemplate')}</button>
      <button style={button} disabled={busy || !selected} onClick={() => perform('default')}>{t(selected?.is_default ? 'saveFlow.clearDefault' : 'saveFlow.makeDefault')}</button>
      <button style={button} disabled={busy || !selected} onClick={() => perform('delete')}>{t('saveFlow.deleteTemplate')}</button>
    </div>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>{t('saveFlow.defaultHint')}</p>
  </section>;
}
