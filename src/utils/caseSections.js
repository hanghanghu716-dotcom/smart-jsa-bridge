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


const sectionNumber = node => node.tagName === 'h2' ? Number(nodeText(node).trim().match(/^(\d+)[.\s]/)?.[1]) : NaN;
const shiftedAnchor = value => value.replace(/^(#?section-)(\d+)$/, (match,prefix,number) =>
  Number(number)>=4 && Number(number)<=10 ? prefix+(Number(number)+1) : number==='11' ? prefix+'13' : match);

// Split only at a section heading, never inside the master table. Cloning
// ancestor wrappers keeps both HTML fragments well formed (including RTL).
export function splitCaseForCommerce(content = '') {
  const sections=splitCaseSections(content);
  const fallback={...sections,beforeProducts:sections.main,afterProducts:'',earlyProducts:false,productSection:12,resourcesSection:11};
  let beforeProducts,afterProducts;
  if (/^\s*#{1,6}\s/.test(sections.main)) {
    const lines=sections.main.split('\n');
    let fenced=false,third=-1,boundary=lines.length;
    for(let i=0;i<lines.length;i++){
      if(/^\s*(?:\x60{3,}|~{3,})/.test(lines[i])){fenced=!fenced;continue;}
      if(fenced||!/^##\s/.test(lines[i]))continue;
      const heading=lines[i].replace(/^##\s+/,'').replace(/<[^>]*>/g,'').replace(/\*\*|__/g,'').trim();
      const n=Number(heading.match(/^(\d+)[.\s]/)?.[1]);
      if(n===3)third=i;
      if(third>=0&&n>3&&n<=10){boundary=i;break;}
    }
    if(third<0)return fallback;
    // Do not renumber code examples or ordinary numbered lists.
    const renumber = (source,headings) => {
      let inFence=false;
      return source.map(line=>{
        if(/^\s*(?:\x60{3,}|~{3,})/.test(line)){inFence=!inFence;return line;}
        if(inFence)return line;
        let result=line.replace(/((?:id|href)=["'])(#?section-\d+)(["'])/g,(_,a,b,c)=>a+shiftedAnchor(b)+c)
          .replace(/(\]\()(#section-\d+)(\))/g,(_,a,b,c)=>a+shiftedAnchor(b)+c);
        if(headings&&/^##\s/.test(result))result=result.replace(/^(##\s+(?:<[^>]*>|\*\*|__|\s)*)([4-9]|10)([.\s])/,
          (_,prefix,n,suffix)=>prefix+(Number(n)+1)+suffix);
        return result;
      }).join('\n');
    };
    beforeProducts=renumber(lines.slice(0,boundary),false);
    afterProducts=renumber(lines.slice(boundary),true);
  } else {
    const root=parseFragment(sections.main);
    let third=false,boundary=null;
    function locate(node){
      const n=sectionNumber(node);
      if(n===3)third=true;
      if(third&&!boundary&&n>3&&n<=10)boundary=node;
      for(const child of node.childNodes||[])locate(child);
    }
    locate(root);
    if(!third)return fallback;
    let after=false;
    function partition(node){
      if(node===boundary)after=true;
      if(!node.childNodes?.length)return after?[null,node]:[node,null];
      const left=[],right=[];
      for(const child of node.childNodes){const [a,b]=partition(child);if(a)left.push(a);if(b)right.push(b);}
      const copy=children=>{
        const result={...node,childNodes:children,attrs:node.attrs?.map(attr=>({...attr}))};
        for(const child of children)child.parentNode=result;
        return result;
      };
      const a=left.length?copy(left):null,b=right.length?copy(right):null;
      // A wrapper split in two cannot own the same HTML id twice.
      if(a&&b&&b.attrs)b.attrs=b.attrs.filter(attr=>attr.name!=='id');
      return [a,b];
    }
    const [left,right]=partition(root);
    function renumber(node,headings){
      if(!node)return;
      const n=sectionNumber(node);
      if(headings&&n>=4&&n<=10){
        let done=false;
        function replaceFirst(part){
          if(!done&&part.nodeName==='#text'&&/^\s*\d+[.\s]/.test(part.value)){
            part.value=part.value.replace(/\d+/,String(n+1));done=true;
          }
          for(const child of part.childNodes||[])replaceFirst(child);
        }
        replaceFirst(node);
      }
      for(const attr of node.attrs||[])if(attr.name==='id'||attr.name==='href')attr.value=shiftedAnchor(attr.value);
      for(const child of node.childNodes||[])renumber(child,headings);
    }
    renumber(left,false);renumber(right,true);
    beforeProducts=left?serialize(left):'';
    afterProducts=right?serialize(right):'';
  }
  return {...sections,beforeProducts,afterProducts,earlyProducts:true,productSection:4,resourcesSection:12};
}
