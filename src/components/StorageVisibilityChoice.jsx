import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { getVisibilityUi } from '../locales/visibilityUi';
import '../styles/storage-visibility.css';

export default function StorageVisibilityChoice({ value, onChange, disabled = false }) {
  const { i18n } = useTranslation();
  const ui = getVisibilityUi(i18n.language);
  const id = useId();
  return <fieldset className="storage-visibility" dir={i18n.dir()} disabled={disabled} aria-describedby={`${id}-hint`}>
    <legend>{ui.title}</legend>
    <div className="storage-visibility-options">
      {['private', 'public'].map(mode => <label key={mode} className={value === mode ? 'is-selected' : ''}>
        <input type="radio" name={`${id}-visibility`} value={mode} checked={value === mode} onChange={() => onChange(mode)} data-storage-visibility={mode} />
        <span><strong>{ui[mode]}</strong><span>{ui[`${mode}Description`]}</span></span>
      </label>)}
    </div>
    <p id={`${id}-hint`}>{ui.choiceHint}</p>
    <div className="storage-visibility-notice" aria-live="polite">
      <strong>{value === 'public' ? ui.publicTitle : ui.privateTitle}</strong>
      <p>{value === 'public' ? ui.publicNotice : ui.privateNotice}</p>
      {value === 'public' && <p>{ui.publicReview}</p>}
    </div>
  </fieldset>;
}
