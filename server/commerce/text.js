export const cleanCommerceText = value => String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
 .replace(/https?:\/\/\S+/g,' ').replace(/\s+/g,' ').toLowerCase();
export function commerceText(snapshot) {
 const body=String(snapshot.body||'').split(/<h2\b[^>]*>\s*9[.\s]/i)[0]
  .replace(/<h[3-6]\b[^>]*>[^<]*(?:별도\s*검토|제외\s*범위|out.of.scope|excluded\s*scope)[^<]*<\/h[3-6]>\s*<p\b[^>]*>[\s\S]*?<\/p>/gi,' ');
 return cleanCommerceText([snapshot.title,snapshot.scope,body,...(snapshot.steps||[]).map(s=>
  [s.title,s.detail,...(s.hazards||[]),...(s.controls||[]).flat(),s.additional].join(' '))].filter(Boolean).join(' '));
}
