// Loaded only when a PDF card enters the viewport. One rasterization at a time.
let modulePromise, queue = Promise.resolve();
const cache = new Map(), MAX_CACHE = 24, MAX_AGE = 300000;
async function render(url, signal) {
 if (signal?.aborted) return '';
 modulePromise ||= Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'),import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')]).then(([pdf,worker]) => {pdf.GlobalWorkerOptions.workerSrc = worker.default; return pdf;});
 const pdfjs = await modulePromise;
 if (signal?.aborted) return '';
 const task = pdfjs.getDocument({url,withCredentials:false,isEvalSupported:false,disableAutoFetch:true,disableStream:true,rangeChunkSize:65536,maxImageSize:8000000});
 const timer = setTimeout(() => task.destroy(),12000);
 const abort = () => {task.destroy().catch(() => {});};
 signal?.addEventListener('abort',abort,{once:true});
 try {
  const pdf = await task.promise, page = await pdf.getPage(1), base = page.getViewport({scale:1});
  const viewport = page.getViewport({scale:Math.min(1.5,720 / Math.max(base.width,base.height))});
  const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'white'}).promise;
  return canvas.toDataURL('image/webp',.8);
 } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);await task.destroy();}
}
export function pdfThumbnail(url, signal) {
 const stored = cache.get(url);
 if (stored && Date.now() - stored.time < MAX_AGE) return Promise.resolve(stored.image);
 const job = queue.then(async () => {
  if (signal?.aborted) return '';
  const existing = cache.get(url); if (existing && Date.now()-existing.time < MAX_AGE) return existing.image;
  try { const image = await render(url,signal); if (image) { cache.delete(url);cache.set(url,{image,time:Date.now()});while(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value); } return image; } catch {return '';}
 });
 queue = job.catch(() => ''); return job;
}
