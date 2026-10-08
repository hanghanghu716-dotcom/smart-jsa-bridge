// Defaults apply to new work only. Records without a format retain legacy A4.
export const normalizePaperSize = value => value === 'letter' ? 'letter' : 'a4';
export const defaultPaperSize = jurisdiction => jurisdiction === 'US' || jurisdiction === 'CA' || jurisdiction?.startsWith('CA-') ? 'letter' : 'a4';
export function paperDimensions(size, orientation = 'landscape') {
  const [short, long] = normalizePaperSize(size) === 'letter' ? [215.9, 279.4] : [210, 297];
  return orientation === 'portrait' ? { width: short, height: long } : { width: long, height: short };
}
export function paperPreviewWidth(size, orientation = 'landscape') {
  const base = orientation === 'portrait' ? 750 : 1080;
  return Math.round(base * (paperDimensions(size, orientation).width - 20) / (paperDimensions('a4', orientation).width - 20));
}
export function paperPrintStyles() {
  return ['a4', 'letter'].flatMap(size => ['portrait', 'landscape'].map(orientation =>
    `@page ${size}-${orientation}{size:${size === 'a4' ? 'A4' : 'Letter'} ${orientation};margin:10mm}`)).join('');
}
