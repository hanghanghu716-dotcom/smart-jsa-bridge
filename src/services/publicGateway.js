export async function publicGateway(action,payload={}) {
  const response=await fetch('/api/public-gateway',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('REQUEST_FAILED');
  return response.json();
}
