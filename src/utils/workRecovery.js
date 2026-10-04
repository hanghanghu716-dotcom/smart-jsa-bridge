const DB = 'smartjsa-work-recovery-v1';
export const RECOVERY_TTL = 7 * 86400000;
export const RECOVERY_LIMIT = 5 * 1024 * 1024;
export function recoveryKey(owner, kind, id) {
  if (!owner || !['package', 'run'].includes(kind) || !id) throw Error('RECOVERY_SCOPE');
  return `${owner}:${kind}:${id}`;
}
export function validRecovery(row, owner, base, now = Date.now()) {
  return Boolean(row && row.owner === owner && row.base === base && row.version === 1 &&
    Number.isFinite(row.savedAt) && now - row.savedAt < RECOVERY_TTL && row.savedAt <= now && row.value);
}
export function recoveryValue(kind, value) {
  const copy = structuredClone(value);
  // Continuing an unfinished work never carries forward a review/approval decision.
  if (kind === 'run') copy.regionalReviewed = false;
  return copy;
}
async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('RECOVERY_BLOCKED'));
  });
}
export async function readRecovery(key) {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite'), store = tx.objectStore('drafts');
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (!entry) return;
      if (Date.now() - entry.value.savedAt >= RECOVERY_TTL) entry.delete();
      entry.continue();
    };
    let row;
    const request = store.get(key);
    request.onsuccess = () => {
      row = request.result;
      if (row && Date.now() - row.savedAt >= RECOVERY_TTL) { store.delete(key); row = undefined; }
    };
    tx.oncomplete = () => resolve(row || null);
    tx.onabort = tx.onerror = () => reject(tx.error || Error('RECOVERY_READ'));
  }); } finally { db.close(); }
}
export async function writeRecovery({ key, owner, base, kind, value, revision }) {
  const copy = recoveryValue(kind, value);
  if (new Blob([JSON.stringify(copy)]).size > RECOVERY_LIMIT) throw Error('RECOVERY_LARGE');
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite'), store = tx.objectStore('drafts');
    let conflict = false;
    const request = store.get(key);
    request.onsuccess = () => {
      if ((request.result?.revision || 0) !== revision) { conflict = true; tx.abort(); return; }
      store.put({ key, owner, base, kind, value: copy, revision: revision + 1, version: 1, savedAt: Date.now() });
    };
    tx.oncomplete = () => resolve(revision + 1);
    tx.onabort = tx.onerror = () => reject(Error(conflict ? 'RECOVERY_CONFLICT' : 'RECOVERY_WRITE'));
  }); } finally { db.close(); }
}
export async function removeRecovery(key, revision) {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('drafts', 'readwrite'), store = tx.objectStore('drafts');
    let conflict = false;
    const request = store.get(key);
    request.onsuccess = () => {
      if ((request.result?.revision || 0) !== revision) { conflict = true; tx.abort(); return; }
      store.delete(key);
    };
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(Error(conflict ? 'RECOVERY_CONFLICT' : 'RECOVERY_DELETE'));
  }); } finally { db.close(); }
}
