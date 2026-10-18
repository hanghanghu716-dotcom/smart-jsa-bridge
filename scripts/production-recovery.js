import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const token=process.env.VERCEL_TOKEN,team=process.env.VERCEL_ORG_ID;
const stateFile='.cache/production-recovery.json';
async function alias(){
 const r=await fetch('https://api.vercel.com/v4/aliases/smartjsabridge.com?'+new URLSearchParams({teamId:team}),{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error(`Cannot inspect production deployment (${r.status})`);
 const value=await r.json(),deployment=value.deployment;
 if(!deployment?.id||!deployment.url)throw Error('Production deployment is missing');
 return {id:deployment.id,url:deployment.url.replace(/^https:\/\//,'')};
}
if(!token||!team)throw Error('Deployment credentials missing');
if(process.argv[2]==='capture'){
 const previous=await alias();mkdirSync('.cache',{recursive:true});writeFileSync(stateFile,JSON.stringify(previous));console.log('Previous production deployment recorded.');
}else if(process.argv[2]==='rollback'){
 const previous=JSON.parse(readFileSync(stateFile,'utf8'));
 const candidate=readFileSync('.cache/deployment-url.txt','utf8').trim().replace(/^https:\/\//,'');
 const current=await alias();
 if(current.id===previous.id){console.log('Previous deployment is already active.');}
 else if(current.url!==candidate){throw Error('Production changed after this release; automatic rollback refused.');}
 else{
  const run=spawnSync('npx',['--yes','vercel@59.23.2','rollback','https://'+previous.url,'--token',token],{stdio:'inherit',shell:false});
  if(run.status!==0)throw Error('Production rollback failed');
  const restored=await alias();if(restored.id!==previous.id)throw Error('Rollback verification failed');
  console.log('Previous production deployment restored and verified.');
 }
}else throw Error('Expected capture or rollback');
