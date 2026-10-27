// Operator-only, in-memory preview. No shared image cache or public URL is created.
let renderer;
export async function feedbackPdfPreview(blob, signal) {
 renderer ||= Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'),import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')]).then(([pdf,worker])=>{pdf.GlobalWorkerOptions.workerSrc=worker.default;return pdf;});
 const pdfjs=await renderer;
 if(signal.aborted)throw Error('ABORTED');
 const task=pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,maxImageSize:8000000});
 const abort=()=>{task.destroy().catch(()=>{});},timer=setTimeout(abort,15000);
 signal.addEventListener('abort',abort,{once:true});
 if(signal.aborted)abort();
 try {
  const pdf=await task.promise,page=await pdf.getPage(1),base=page.getViewport({scale:1});
  const viewport=page.getViewport({scale:Math.min(1.5,1000/Math.max(base.width,base.height))});
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'white'}).promise;
  if(signal.aborted)throw Error('ABORTED');
  return {url:canvas.toDataURL('image/webp',.85),pages:pdf.numPages};
 }finally{clearTimeout(timer);signal.removeEventListener('abort',abort);await task.destroy();}
}
