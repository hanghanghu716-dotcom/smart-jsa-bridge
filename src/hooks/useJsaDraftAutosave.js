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
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  const [resumeSequence, setResumeSequence] = useState(0);

  const snapshotJson = JSON.stringify({
    draftId,
    title: formData?.projectName,
    currentStage: stage,
    formData,
    participants,
    procedures,
    analysisData,
    layoutData,
    sourceProjectId,
  });

  useEffect(() => {
    if (!enabled || !draftId || pausedRef.current) return;

    const snapshot = JSON.parse(snapshotJson);
    setStatus('pending');
    const sequence = ++saveSequence.current;

    const timer = window.setTimeout(async () => {
      if (pausedRef.current) return;
      try {
        await saveDraftSnapshot(snapshot);
        if (sequence === saveSequence.current) {
          setStatus('saved');
          setLastSavedAt(new Date());
        }
      } catch (error) {
        console.error('[JSA Draft] autosave failed:', error);
        if (sequence === saveSequence.current) {
          setStatus(error?.code === 'DRAFT_VERSION_CONFLICT' ? 'conflict' : 'error');
        }
      }
    }, delay);
    timerRef.current = timer;

    return () => window.clearTimeout(timer);
  }, [enabled, delay, draftId, snapshotJson, resumeSequence]);

  const flushAndPause = async () => {
    pausedRef.current = true;
    window.clearTimeout(timerRef.current);
    ++saveSequence.current;
    const saved = await saveDraftSnapshot(JSON.parse(snapshotJson));
    setStatus('saved'); setLastSavedAt(new Date());
    return saved;
  };
  const resume = () => { pausedRef.current = false; setResumeSequence(value => value + 1); };
  return { draftId, status, lastSavedAt, flushAndPause, resume };
}
