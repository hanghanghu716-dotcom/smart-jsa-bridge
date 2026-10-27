import { useEffect, useRef } from 'react';
import { caseLanguageLabel, caseLanguageOptions } from '../utils/caseLanguages.js';
import { getLanguageTag } from '../locales/config.js';
import '../styles/case-languages.css';

export default function CaseLanguageSwitch({ locales, locale, slug }) {
  const ref = useRef(null), options = caseLanguageOptions(locales, slug);
  useEffect(() => {
    const close = event => { if (ref.current && !ref.current.contains(event.target)) ref.current.open = false; };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  if (options.length < 2) return null;
  const selected = options.find(option => option.code === locale);
  return <details ref={ref} className="case-language-switch" onKeyDown={event => {
    if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary').focus(); }
  }}>
    <summary><span aria-hidden="true">◎</span> {caseLanguageLabel(locale)} · <span lang={getLanguageTag(locale)}>{selected?.label || locale}</span></summary>
    <nav aria-label={caseLanguageLabel(locale)}>{options.map(option =>
      <a key={option.code} href={option.href} lang={option.lang} hrefLang={option.lang} aria-current={option.code === locale ? 'page' : undefined}>{option.label}</a>
    )}</nav>
  </details>;
}
