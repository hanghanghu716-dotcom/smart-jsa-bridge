import { sourceNoteParts } from '../utils/sourceNotes';
export default function SourceNotes({ value }) {
  return <p className="source-notes">{sourceNoteParts(value).map((part, index) => part.href
    ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
    : <span key={index}>{part.text}</span>)}</p>;
}
