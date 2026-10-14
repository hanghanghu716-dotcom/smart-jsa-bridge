import { useEffect, useState } from 'react';
import { LanguageLink } from '../hooks/useLanguage';
import { pageWindow } from '../utils/pagination';
import { getPaginationUi } from '../locales/paginationUi';
import '../styles/list-pagination.css';

function Arrow({ end = false, forward = false }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={forward ? 'pagination-arrow is-forward' : 'pagination-arrow'}
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 6-6 6 6 6" />{end && <path d="M5 5v14" />}
  </svg>;
}

export default function ListPagination({ current, total, locale, hrefForPage, onPageChange, controls, className = '' }) {
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setCompact(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const ui = getPaginationUi(locale);
  const { page, count, start, end, pages } = pageWindow(current, total, compact ? 5 : 15);
  if (count <= 1) return null;
  function control(target, label, children, kind, disabled = false) {
    const selected = kind === 'number' && target === page;
    const props = {
      className: 'list-pagination-control list-pagination-' + kind,
      'aria-label': label, 'aria-controls': controls,
      'aria-current': selected ? 'page' : undefined,
      rel: target === page - 1 ? 'prev' : target === page + 1 ? 'next' : undefined,
    };
    if (disabled) return <span key={kind} {...props} aria-disabled="true">{children}</span>;
    if (hrefForPage) return <LanguageLink key={kind + target} {...props} to={hrefForPage(target)}
      onClick={event => {
        if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) onPageChange?.(target);
      }}>{children}</LanguageLink>;
    return <button key={kind + target} type="button" {...props} onClick={() => onPageChange(target)}>{children}</button>;
  }
  return <nav className={'list-pagination ' + className} aria-label={ui.label} dir={locale?.startsWith('ar') ? 'rtl' : 'ltr'}>
    {control(1, ui.first, <Arrow end />, 'first', page === 1)}
    {control(Math.max(1, start - (compact ? 5 : 15)), ui.previous, <Arrow />, 'previous', start === 1)}
    <div className="list-pagination-numbers">
      {pages.map(number => control(number, ui.page.replace('{page}', number), number, 'number'))}
    </div>
    {control(end + 1, ui.next, <Arrow forward />, 'next', end === count)}
    {control(count, ui.last, <Arrow end forward />, 'last', page === count)}
  </nav>;
}
