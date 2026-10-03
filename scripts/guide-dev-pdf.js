import fs from 'node:fs';
import path from 'node:path';
import { renderGuides } from './render-guides.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { GUIDE_CATEGORIES, GUIDE_VERSION } from '../src/utils/guideContent.js';

// A fresh checkout must also have working PDFs under `npm run dev`.
// Generate only the requested edition and cache it outside Vite's watched public directory.
export function guideDevPdf(){
 return {name:'localised-guide-pdf',apply:'serve',configureServer(server){
  const relevant=['src/locales','src/pages/guideline','src/utils/guideContent.js','src/utils/regionalCatalog.js','src/utils/regionalWorkTemplates.js','src/styles/guides.css'];
  const newest=file=>!fs.existsSync(file)?0:fs.statSync(file).isDirectory()?Math.max(0,...fs.readdirSync(file).map(n=>newest(path.join(file,n)))):fs.statSync(file).mtimeMs;
  let stamp=Math.max(...relevant.map(newest)),queue=Promise.resolve();const pending=new Map();
  server.watcher.on('change',file=>{const relative=path.relative(process.cwd(),file).replaceAll('\\','/');if(relevant.some(p=>relative===p||relative.startsWith(p+'/')))stamp=Date.now();});
  server.middlewares.use(async(req,res,next)=>{
   const match=new URL(req.url,'http://localhost').pathname.match(/^\/assets\/guides\/([^/]+)\/([a-z-]+)-(\d{4}-\d{2}-\d{2})\.pdf$/);
   if(!match||!['GET','HEAD'].includes(req.method))return next();
   const [,locale,category,version]=match;
   if(!SUPPORTED_LANGS.includes(locale)||!GUIDE_CATEGORIES[category]||version!==GUIDE_VERSION){res.statusCode=404;return res.end();}
   const relative=`assets/guides/${locale}/${category}-${version}.pdf`,publicFile=path.resolve('public',relative),cacheRoot=path.resolve('.cache/guide-preview'),cachedFile=path.join(cacheRoot,relative);
   let file=[publicFile,cachedFile].find(f=>fs.existsSync(f)&&fs.statSync(f).mtimeMs>=stamp);
   try{
    if(!file){
     if(!pending.has(relative)){
      const address=server.httpServer.address(),port=typeof address==='object'?address.port:server.config.server.port;
      const generation=queue.catch(()=>{}).then(()=>renderGuides({baseUrl:`http://127.0.0.1:${port}`,outputRoot:cacheRoot,locales:[locale],categories:[category],snapshots:false}));
      queue=generation;pending.set(relative,generation);generation.finally(()=>pending.delete(relative)).catch(()=>{});
     }
     await pending.get(relative);file=cachedFile;
    }
    res.setHeader('Content-Type','application/pdf');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Length',fs.statSync(file).size);
    if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
   }catch(error){server.config.logger.error(`Guide PDF failed: ${error.message}`);res.statusCode=503;res.end('Guide PDF generation failed. The HTML guide remains available.');}
  });
 }};
}
