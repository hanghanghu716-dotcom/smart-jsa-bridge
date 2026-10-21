import profiles from '../data/regional-guidance-profiles.json' with { type:'json' };
import copy from '../data/regional-guidance-copy.json' with { type:'json' };
// Exact URL jurisdiction only; never borrow another country's legal copy.
export function regionalFixedGuidance(pathname,namespace){
 const locale=pathname.split('/')[1],profile=profiles[locale];
 const language=locale?.split('-')[0],text=copy[language];
 if(!profile||!text?.titles[namespace])return null;
 return {locale,profile,text,namespace,title:`${text.titles[namespace]} — ${profile.name} | Smart JSA Bridge`,
  description:namespace==='about'?text.about[0]:namespace==='jrajsa'?text.intro:profile.scope,checked:'2026-10-20'};
}
