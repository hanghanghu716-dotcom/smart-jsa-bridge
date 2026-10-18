import { documentLines } from '../utils/documentList';

export default function DocumentList({ values = [], bullet = true }) {
  return <span data-document-list style={{ display: 'block', textAlign: 'start', whiteSpace: 'normal' }}>
    {values.filter(value => typeof value === 'string' && value.trim()).map((value, item) =>
      <span key={item} style={{ display: 'block', marginBlockEnd: item < values.length - 1 ? '.4em' : 0 }}>
        {documentLines(value, { bullet }).map((line, index) => <span key={index} style={{
          display: 'block', paddingInlineStart: `${line.indent + (line.marker || line.continuation ? 1.15 : 0)}em`,
          position: 'relative', whiteSpace: 'pre-wrap', minHeight: line.text ? undefined : '.6em',
        }}>
          {line.marker && <span aria-hidden="true" style={{ position: 'absolute', insetInlineStart: `${line.indent}em` }}>{line.marker}</span>}
          {line.text}
        </span>)}
      </span>)}
  </span>;
}
