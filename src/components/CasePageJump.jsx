import { useId, useState } from 'react';

export default function CasePageJump({ current, total, onPageChange, t }) {
  const id = useId();
  const [value, setValue] = useState(String(current));
  const [invalid, setInvalid] = useState(false);
  const submit = event => {
    event.preventDefault();
    const digits = value.trim().replace(/[٠-٩۰-۹０-９]/g, char => String(
      char.charCodeAt(0) - (char >= '０' ? 0xff10 : char >= '۰' ? 0x6f0 : 0x660)
    ));
    const page = Number(digits);
    if (!/^\d+$/.test(digits) || !Number.isSafeInteger(page) || page < 1 || page > total) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onPageChange(page);
    requestAnimationFrame(() => document.getElementById('case-study-results')?.focus({ preventScroll: true }));
  };
  return <form className="case-page-jump" onSubmit={submit} noValidate>
    <label htmlFor={id}>{t('casePagination.jumpLabel')}</label>
    <input id={id} type="text" inputMode="numeric" autoComplete="off" value={value}
      aria-controls="case-study-results" aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      onChange={event => { setValue(event.target.value); setInvalid(false); }} />
    <button type="submit">{t('casePagination.jumpButton')}</button>
    {invalid && <p id={`${id}-error`} className="case-page-jump-error" role="alert">
      {t('casePagination.jumpError', { total })}
    </p>}
  </form>;
}
