import { paperDimensions } from './paperFormat.js';
export function reportFirstPageHeight(element, orientation = 'landscape', paperSize = 'a4') {
 const bounds = element.getBoundingClientRect(), {width,height} = paperDimensions(paperSize,orientation);
 const limit = Math.min(bounds.height,(height-20)*bounds.width/(width-20));
 const cuts = [...element.querySelectorAll('tr,[data-print-block]')]
  .filter(el=>el.tagName!=='TR'||!el.closest('thead'))
  .filter(el=>{const table=el.tagName==='TR'?el.closest('table'):null;return !table||table.getBoundingClientRect().height>limit*.4||el===table.rows[table.rows.length-1];})
  .map(el=>1+Math.ceil(el.getBoundingClientRect().bottom-bounds.top)).filter(bottom=>bottom>20&&bottom<=limit);
 return bounds.height>limit&&cuts.length?Math.max(...cuts):Math.ceil(limit);
}
