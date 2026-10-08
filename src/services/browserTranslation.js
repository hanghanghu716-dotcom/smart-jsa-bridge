// Only public, already-redacted text is translated. No network translation fallback.
export const textLanguage = locale => typeof locale === 'string' ? locale.split('-')[0] : '';
export function translationPairs(rows, locale) {
  const targetLanguage=textLanguage(locale);
  return [...new Set(rows.map(row=>textLanguage(row.public_locale)).filter(lang=>lang&&lang!==targetLanguage))]
    .map(sourceLanguage=>({sourceLanguage,targetLanguage}));
}
export function translationPayload(rows, detail=false) {
  return rows.map(row=>({id:row.id,updated_at:row.updated_at,public_locale:row.public_locale,title:row.title,
    ...(detail?{form_data:row.form_data,analysis_data:row.analysis_data,custom_layout:row.custom_layout,publication_context:row.publication_context}:{})}));
}
export async function translationAvailability(rows, locale, api=globalThis.Translator) {
  const pairs=translationPairs(rows,locale);
  if(!pairs.length)return 'original';
  if(!api)return 'unsupported';
  const states=await Promise.all(pairs.map(pair=>api.availability(pair)));
  return states.includes('unavailable')?'unsupported':states.every(state=>state==='available')?'available':'download';
}
export async function translatePublicRows(rows, locale, {detail=false,api=globalThis.Translator,signal,onProgress=()=>{}}={}) {
  if(!api)throw new Error('TRANSLATION_UNAVAILABLE');
  const pairs=translationPairs(rows,locale),translators=new Map(),cache=new Map();
  const check=()=>{if(signal?.aborted)throw new DOMException('Cancelled','AbortError');};
  try {
    check();
    // Start model creation during the click, before awaiting: download needs activation.
    const results=await Promise.allSettled(pairs.map(async pair=>{
      const translator=await api.create({...pair,signal,monitor(m){m.addEventListener('downloadprogress',event=>onProgress(Math.round(event.loaded*100)));}});
      translators.set(pair.sourceLanguage,translator);
    }));
    const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
    const output=structuredClone(rows);
    for(const row of output){
      check();const source=textLanguage(row.public_locale),translator=translators.get(source);if(!translator)continue;
      const text=async value=>{
        check();if(typeof value!=='string'||!value.trim()||/^[A-Z][A-Z0-9_]+$/.test(value))return value;
        const key=source+'\0'+value;
        if(!cache.has(key)){
          const translated=await translator.translate(value,{signal});check();
          if(typeof translated!=='string'||!translated.trim())throw new Error('EMPTY_TRANSLATION');
          cache.set(key,translated);
        }
        return cache.get(key);
      };
      row.title=await text(row.title);
      if(!detail)continue;
      row.form_data.projectName=await text(row.form_data.projectName);
      for(const key of ['ppe','permits'])row.form_data[key]=await Promise.all((row.form_data[key]||[]).map(text));
      for(const step of row.analysis_data){
        for(const key of ['stepTitle','stepDetail'])step.proc[key]=await text(step.proc[key]);
        // Never translate risk values, canonical category keys, source IDs or structure.
        for(const risk of step.risks)for(const key of ['factor','measure','current_measure','recommend_measure'])risk[key]=await text(risk[key]);
      }
      for(const key of ['scope','limitations'])row.publication_context[key]=await text(row.publication_context[key]);
      for(const key of ['docTitle','appr1','appr2','appr3'])row.custom_layout[key]=await text(row.custom_layout[key]);
      for(const column of row.custom_layout.savedUserColumns||[])column.label=await text(column.label);
      for(const column of Object.values(row.custom_layout.savedColumnOverrides||{}))column.label=await text(column.label);
    }
    return output;
  } finally { for(const translator of translators.values())translator.destroy(); }
}
