import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { recoveryUi } from '../../locales/workRecoveryUi';
export default function WorkStorageUsage({ locale }) {
  const t = recoveryUi(locale), [usage, setUsage] = useState(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.rpc('work_storage_summary').then(({data, error}) => {
      if (!active) return;
      if (error || !data || !Number.isFinite(Number(data.bytes))) setFailed(true);
      else setUsage(data);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (!usage && !failed) return null;
  const mb = value => `${(Number(value) / 1048576).toFixed(2)} MB`;
  return <aside className="work-storage jsa-notice" aria-label={t.usage}>
    <strong>{t.usage}</strong>
    {failed ? <p role="status">{t.usageError}</p> : <>
      <p>{mb(usage.bytes)} · {t.files}: {usage.files}</p>
      {usage.unregisteredFiles > 0 && <p>{t.unlinked}: {usage.unregisteredFiles} · {mb(usage.unregisteredBytes)}</p>}
      <p>{t.usageHelp}</p>
    </>}
  </aside>;
}
