export async function publicGateway(action,payload={}) {
  const response=await fetch('/api/public-gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(12000)});
  const result=await response.json();
  if(!response.ok||result?.error)throw Error(result?.error||'REQUEST_FAILED');
  return result;
}
