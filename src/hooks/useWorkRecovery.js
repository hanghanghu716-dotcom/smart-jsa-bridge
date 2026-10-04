import { useEffect, useRef, useState } from 'react';
import { readRecovery, writeRecovery, removeRecovery, recoveryKey, validRecovery, recoveryValue } from '../utils/workRecovery';

export default function useWorkRecovery({ owner, kind, id, base, value, dirty, restore }) {
  const [state, setState] = useState({ status: 'loading', candidate: null });
  const session = useRef(null);
  const key = owner && id ? recoveryKey(owner, kind, id) : null;
  useEffect(() => {
    const s = { key, revision: 0, writes: 0, allowed: false, active: true, queue: Promise.resolve() };
    session.current = s;
    setState({ status: 'loading', candidate: null });
    if (!key) return () => { s.active = false; };
    readRecovery(key).then(row => {
      if (!s.active) return;
      s.revision = row?.revision || 0;
      s.allowed = !row;
      setState({ status: row ? 'choice' : 'ready', candidate: row,
        compatible: validRecovery(row, owner, base) });
    }).catch(() => { if (s.active) setState({ status: 'error', candidate: null }); });
    return () => { s.active = false; };
  }, [key, owner, base]);
  const enqueue = (s, operation) => {
    const next = s.queue.then(operation);
    s.queue = next.catch(() => {});
    return next;
  };
  useEffect(() => {
    const s = session.current;
    if (!dirty || !s?.allowed || s.key !== key) return;
    const write = ++s.writes;
    setState(prev => ({ ...prev, status: 'saving' }));
    // Queue immediately: closing or unmounting does not cancel an already-started write.
    enqueue(s, async () => {
      s.revision = await writeRecovery({ key, owner, kind, base, value, revision: s.revision });
    }).then(() => { if (s.active && s.allowed && write === s.writes) setState(prev => ({ ...prev, status: 'saved' })); })
      .catch(error => { s.allowed = false; if (s.active) setState(prev => ({ ...prev, status: error.message === 'RECOVERY_CONFLICT' ? 'conflict' : 'error' })); });
  }, [value, dirty, key, base, owner, kind]);
  const clear = async () => {
    const s = session.current;
    if (!s?.key) throw Error('RECOVERY_SCOPE');
    s.allowed = false;
    try { await enqueue(s, async () => { await removeRecovery(s.key, s.revision); s.revision = 0; }); }
    catch (error) { if (s.active) setState(prev => ({ ...prev, status: 'error' })); throw error; }
    if (s.active) { s.allowed = true; setState({ status: 'ready', candidate: null }); }
  };
  const discard = () => clear().catch(() => setState(prev => ({ ...prev, status: 'error' })));
  const resume = () => {
    const s = session.current;
    if (!state.compatible || !state.candidate || !s) return;
    s.allowed = true;
    restore(recoveryValue(kind, state.candidate.value));
    setState({ status: 'saved', candidate: null });
  };
  return { ...state, clear, discard, resume, blocked: state.status === 'loading' || Boolean(state.candidate) };
}
