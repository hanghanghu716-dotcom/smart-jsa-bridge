import { useEffect, useState } from 'react';
import { getExistingActiveDraftId, loadDraft } from '../services/jsaDraftService';

export default function useJsaDraftRecovery(enabled = true) {
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setDraft(null);
      setStatus('idle');
      return () => {};
    }

    const draftId = getExistingActiveDraftId();
    if (!draftId) {
      setDraft(null);
      setStatus('empty');
      return () => {};
    }

    setStatus('loading');
    loadDraft(draftId)
      .then(data => {
        if (cancelled) return;
        setDraft(data || null);
        setStatus(data ? 'ready' : 'empty');
      })
      .catch(error => {
        console.error('[JSA Draft] recovery failed:', error);
        if (!cancelled) {
          setDraft(null);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { draft, status };
}
