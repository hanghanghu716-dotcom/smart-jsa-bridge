import { validProjectId } from './publicJsa.js';

export const THUMBNAIL_BUCKET = 'jsa-thumbnails';
export const THUMBNAIL_RENDERER = 'risk-v1';
export const THUMBNAIL_MAX_BYTES = 200 * 1024;

export function validThumbnailRevision(value) {
  return typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
}
export function thumbnailObjectPath(id, revision) {
  if (!validProjectId(id) || !validThumbnailRevision(revision)) return null;
  return `${id}/${revision}/${THUMBNAIL_RENDERER}.webp`;
}
export function publicThumbnailUrl(id, revision) {
  return thumbnailObjectPath(id, revision)
    ? '/api/jsa-thumbnail?' + new URLSearchParams({ id, revision }) : null;
}
export function storedThumbnail(row) {
  const revision = row.revision || row.assessment?.revision;
  if (row.thumbnail_revision !== revision) return null;
  const src = publicThumbnailUrl(row.id, row.thumbnail_revision);
  return src ? { src, width: row.thumbnail_width, height: row.thumbnail_height } : null;
}
