import { documentLines } from '../src/utils/documentList.js';
import { escapeHtml } from './public-content.js';

export function documentTextHtml(value) {
  return `<span data-document-text style="display:block">${documentLines(value).map(line =>
    `<span style="display:block;position:relative;white-space:pre-wrap;padding-inline-start:${line.indent + (line.marker ? 1.15 : 0)}em;min-height:${line.text ? 0 : '.6em'}">${line.marker ? `<span aria-hidden="true" style="position:absolute;inset-inline-start:${line.indent}em">${escapeHtml(line.marker)}</span>` : ''}${escapeHtml(line.text)}</span>`
  ).join('')}</span>`;
}
