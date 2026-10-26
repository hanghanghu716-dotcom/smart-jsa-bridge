let queue = Promise.resolve();
const cache = new Map();
export function riskThumbnailKey(row,locale) {return [row.id,row.content_updated_at,row.updated_at,row.public_locale || locale].join('|');}
export function cachedRiskThumbnail(key) {return cache.get(key) || '';}
export function queueRiskThumbnail(key, capture, signal) {
 const task = queue.then(async () => {
  if(signal.aborted) return '';
  if(cache.has(key))return cache.get(key);
  const image=await capture();
  if(image&&!signal.aborted){cache.set(key,image);while(cache.size>12)cache.delete(cache.keys().next().value);}
  return image;
 });
 queue=task.catch(()=> '');return task;
}
