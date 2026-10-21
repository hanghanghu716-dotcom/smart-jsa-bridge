import { parseFragment, serialize } from 'parse5';

const nodeText = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(nodeText).join('');

// Preserve nested wrappers and the original review wording. This transformation
// is shared by the live HTML response and the hydrated case page.
export function splitCaseSections(content = '') {
  if (/^\s*#{1,6}\s/.test(content)) {
    const lines=content.split('\n');
    let fenced=false, start=-1, reviewStart=-1;
    for(let i=0;i<lines.length;i++) {
      if(/^\s*(?:```|~~~)/.test(lines[i])) { fenced=!fenced; continue; }
      if(fenced||!/^##\s/.test(lines[i]))continue;
      const heading=lines[i].replace(/^##\s+/,'').replace(/<[^>]*>/g,'').replace(/\*\*|__/g,'').trim();
      if(start<0&&/^1[.\s]/.test(heading))start=i;
      if(/^11[.\s]/.test(heading))reviewStart=i;
    }
    if(start>=0) {
      const introduction=lines.slice(0,start).join('\n').trim();
      const main=lines.slice(start,reviewStart>start?reviewStart:undefined).join('\n');
      const review=reviewStart>start?lines.slice(reviewStart).join('\n').replace(/^(##\s+(?:\*\*|__)?)(11)([.\s])/,(_match,prefix,_number,suffix)=>prefix+'13'+suffix):'';
      return {main,review,...(introduction?{introduction}:{})};
    }
  }
  const root = parseFragment(content);
  let review = '';
  function visit(parent) {
    const children = parent.childNodes || [];
    const index = children.findIndex(node => node.tagName === 'h2' && /^\s*11[.\s]/.test(nodeText(node)));
    if (index >= 0) {
      const tail = children.splice(index);
      let replaced = false;
      function renumber(node) {
        if (node.nodeName === '#text' && !replaced && /^\s*11[.\s]/.test(node.value)) {
          node.value = node.value.replace(/11/, '13'); replaced = true;
        }
        for (const attr of node.attrs || []) if (attr.name === 'id' && attr.value === 'section-11') attr.value = 'section-13';
        for (const child of node.childNodes || []) renumber(child);
      }
      renumber(tail[0]);
      review = serialize({ nodeName: '#document-fragment', childNodes: tail });
      return true;
    }
    return children.some(visit);
  }
  visit(root);
  let introduction = '';
  function moveIntroduction(parent) {
    const children = parent.childNodes || [];
    const index = children.findIndex(node => node.tagName === 'h2' && /^\s*1[.\s]/.test(nodeText(node)));
    if (index >= 0) {
      const before = children.splice(0, index);
      if (before.some(node => nodeText(node).trim() || node.tagName === 'img')) {
        introduction = serialize({nodeName:'#document-fragment', childNodes:before});
      }
      return true;
    }
    return children.some(moveIntroduction);
  }
  moveIntroduction(root);
  return { main: review || introduction ? serialize(root) : content, review, ...(introduction ? {introduction} : {}) };
}

export function caseResourcesTitle(locale) {
  return ({ko:'사례 PDF와 작업 문서', en:'Case PDFs and work documents',ja:'事例PDFと作業文書',de:'Fall-PDFs und Arbeitsdokumente',fr:'PDF du cas et documents de travail',it:'PDF del caso e documenti di lavoro',es:'PDF del caso y documentos de trabajo',pt:'PDFs do caso e documentos de trabalho',ro:'PDF-uri ale cazului și documente de lucru',ru:'PDF примера и рабочие документы',ar:'ملفات الحالة PDF ووثائق العمل'})[locale?.split('-')[0]] || 'Case PDFs and work documents';
}
