import { useTranslation } from 'react-i18next';
import { recoveryUi } from '../../locales/workRecoveryUi';
export default function RecoveryNotice({ recovery, kind }) {
  const { i18n } = useTranslation(), t = recoveryUi(i18n.language);
  return <section className="work-recovery jsa-notice" aria-label={t.choice}>
    <p>{t.notice}</p>
    {recovery.candidate && <><p>{recovery.compatible ? t.choice : t.changed}</p>
      {kind === 'run' && <p>{t.fresh}</p>}
      <div className="work-tools">
        {recovery.compatible && <button type="button" onClick={recovery.resume}>{t.resume}</button>}
        <button type="button" onClick={recovery.discard}>{t.discard}</button>
      </div></>}
    <p role="status">{t[recovery.status] || ''}</p>
  </section>;
}
