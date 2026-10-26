export function reportPageGeometry(element, pagePixels, pixelRatio = 1) {
 const bounds = element.getBoundingClientRect();
 const cuts = [...element.querySelectorAll('tr,[data-print-block]')]
  .filter(el => el.tagName !== 'TR' || !el.closest('thead'))
  .filter(el => { const table = el.tagName === 'TR' ? el.closest('table') : null;
   return !table || table.getBoundingClientRect().height * pixelRatio > pagePixels * .4 || el === table.rows[table.rows.length - 1]; })
  .map(el => 1 + Math.ceil((el.getBoundingClientRect().bottom - bounds.top) * pixelRatio)).sort((a,b)=>a-b);
 const headings = [...element.querySelectorAll('table')].flatMap(table => {
  if (!table.tHead) return [];
  const head=table.tHead.getBoundingClientRect(), rect=table.getBoundingClientRect();
  const top=Math.max(0,Math.floor((head.top-bounds.top)*pixelRatio)), bottom=Math.ceil((head.bottom-bounds.top)*pixelRatio);
  const height=bottom-top, tableBottom=Math.ceil((rect.bottom-bounds.top)*pixelRatio);
  return height>0 && height<pagePixels-20 ? [{top,bottom,tableBottom,height}] : [];
 });
 return {cuts,headings};
}
export function reportPages(contentHeight, pagePixels, {cuts=[],headings=[]} = {}) {
 const pages=[]; let y=0;
 if (!(pagePixels>20) || !Number.isFinite(contentHeight)) throw Error('WORK_RENDER_FAILED');
 while(y<contentHeight) {
  if(pages.length>=100) throw Error('WORK_OUTPUT_LARGE');
  const heading=headings.find(h=>y>=h.bottom && y<h.tableBottom-1), headingHeight=heading?.height || 0;
  const max=Math.min(contentHeight,y+pagePixels-headingHeight);
  let end=max;
  if(max<contentHeight){const candidates=cuts.filter(c=>c>y+20 && c<=max);if(candidates.length)end=candidates[candidates.length-1];}
  if(end<=y) throw Error('WORK_RENDER_FAILED');
  pages.push({start:y,end,heading,headingHeight}); y=end;
 }
 return pages;
}
