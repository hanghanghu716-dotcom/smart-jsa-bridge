// Preserve authored line breaks and nesting while separating bullet markers
// from the text so wrapped lines align with the text, not with the marker.
export function documentLines(value, { bullet = false } = {}) {
  return String(value ?? '').replace(/\r\n?/g, '\n').split('\n').map((line, index) => {
    const indent = (line.match(/^[\t ]*/)?.[0] || '').replace(/\t/g, '    ').length;
    const text = line.trimStart();
    const match = text.match(/^([•●▪◦‣⁃]|[-*+]\s|\d+[.)]\s)\s*/u);
    return {
      text: match ? text.slice(match[0].length) : text,
      marker: match ? match[1].trim() : bullet && index === 0 && text ? '•' : '',
      indent: Math.min(indent / 2, 12),
      continuation: bullet && index > 0 && !match,
    };
  });
}

