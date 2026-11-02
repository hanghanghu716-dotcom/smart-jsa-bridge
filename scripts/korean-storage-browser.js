// Reuse the existing isolated storage and regional output fixtures with Korean settings.
import {createServer} from 'vite';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const server=await createServer({root,server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const base='http://127.0.0.1:'+server.httpServer.address().port;
try{
 for(const script of (process.env.KOREAN_STORAGE_SCRIPTS||'project-storage-browser.cjs,regional-work-browser.cjs').split(',')){
  console.log('RUN '+script);
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['scripts/'+script],{cwd:root,stdio:'inherit',env:{...process.env,JSA_QA_BASE_URL:base,WORK_TEST_URL:base,WORK_TEST_COUNTRY:'KR',WORK_TEST_LOCALE:'ko',WORK_TEST_PERMIT:'1',WORK_TEST_OUTPUT_GROUP:'korean-site-audit'}});
   child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(script+' exited '+code)));
  });
 }
}finally{await server.close();}
