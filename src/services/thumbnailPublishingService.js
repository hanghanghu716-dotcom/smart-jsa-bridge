import { PUBLIC_JSA_FIELDS, publicJsaView, validProjectId } from '../utils/publicJsa.js';
import { THUMBNAIL_BUCKET, THUMBNAIL_RENDERER, THUMBNAIL_MAX_BYTES, thumbnailObjectPath } from '../utils/publicThumbnail.js';

export async function pendingThumbnails(client, ownerId, signal) {
  if (!validProjectId(ownerId)) return [];
  const { data, error } = await client.from('public_jsa_cards').select('id,revision')
    .eq('author_id', ownerId).eq('is_public', true).is('thumbnail_revision', null)
    .order('published_at', { ascending: false }).order('id', { ascending: true }).limit(12).abortSignal(signal);
  if (error) throw error;
  return (data || []).filter(row => thumbnailObjectPath(row.id, row.revision));
}

export async function publishThumbnail({ client, ownerId, item, render, signal }) {
  signal?.throwIfAborted();
  // Read the persisted, public-only view, never the private editor's DOM/state.
  const { data, error } = await client.from('public_jsa_catalog').select(PUBLIC_JSA_FIELDS)
    .eq('id', item.id).eq('author_id', ownerId).eq('is_public', true).abortSignal(signal).maybeSingle();
  if (error) throw error;
  const row = publicJsaView(data);
  if (!row || row.author_id !== ownerId || row.assessment.revision !== item.revision ||
      row.assessment.review === 'rejected') return false;
  const path = thumbnailObjectPath(row.id, row.assessment.revision);
  if (!path) return false;
  const { data: previous, error: previousError } = await client.from('jsa_thumbnail_assets')
    .select('revision').eq('project_id', row.id).abortSignal(signal).maybeSingle();
  if (previousError) throw previousError;
  if (previous?.revision === item.revision) return true;
  const image = await render(row, signal);
  signal?.throwIfAborted();
  if (image?.blob?.type !== 'image/webp' || !image.blob.size || image.blob.size > THUMBNAIL_MAX_BYTES ||
      image.width !== 720 || !Number.isInteger(image.height) || image.height < 300 || image.height > 1200) throw new Error('INVALID_THUMBNAIL');
  const bucket = client.storage.from(THUMBNAIL_BUCKET);
  // Immutable object names: another tab can finish the same revision first.
  const upload = await bucket.upload(path, image.blob, { contentType: 'image/webp', cacheControl: '0', upsert: false });
  if (upload.error && !['409','Duplicate'].includes(String(upload.error.statusCode || upload.error.code))) throw upload.error;
  signal?.throwIfAborted();
  const saved = await client.from('jsa_thumbnail_assets').upsert({
    project_id: row.id, revision: item.revision, renderer: THUMBNAIL_RENDERER, width: image.width, height: image.height,
  }, { onConflict: 'project_id' });
  // RLS rejects stale revisions and withdrawn content, even if changed mid-capture.
  if (saved.error) throw saved.error;
  if (previous?.revision && previous.revision !== item.revision) {
    const oldPath = thumbnailObjectPath(row.id, previous.revision);
    if (oldPath) await bucket.remove([oldPath]).catch(() => {});
  }
  return true;
}
