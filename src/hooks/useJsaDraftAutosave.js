import { useEffect, useMemo, useRef, useState } from 'react';
import { getActiveDraftId, saveDraftSnapshot } from '../services/jsaDraftService';

export default function useJsaDraftAutosave({
  stage,
  formData,
  participants,
  procedures,
  analysisData,
  layoutData,
  sourceProjectId,
  enabled = true,
  delay = 900,
}) {
  const draftId = useMemo(() => getActiveDraftId(), []);
  const [status, setStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveSequence = useRef(0);

  useEffect(() => {
    if (!enabled || !draftId) return;

    const snapshot = {
      draftId,
      title: formData?.projectName,
      currentStage: stage,
      formData,
      participants,
      procedures,
      analysisData,
      layoutData,
      sourceProjectId,
    };

    setStatus('pending');
    const sequence = ++saveSequence.current;

    const timer = window.setTimeout(async () => {
      try {
        await saveDraftSnapshot(snapshot);
        if (sequence === saveSequence.current) {
          setStatus('saved');
          setLastSavedAt(new Date());
        }
      } catch (error) {
        console.error('[JSA Draft] autosave failed:', error);
        if (sequence === saveSequence.current) setStatus('error');
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    delay,
    draftId,
    stage,
    formData,
    participants,
    procedures,
    analysisData,
    layoutData,
    sourceProjectId,
  ]);

  return { draftId, status, lastSavedAt };
}
