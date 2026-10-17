import React, { useLayoutEffect, useRef } from 'react';

// Keep words intact without changing the user's saved column widths.
export default function DocumentTableHeading({ children, style, lang, ...props }) {
  const cellRef = useRef(null);
  const labelRef = useRef(null);

  useLayoutEffect(() => {
    const cell = cellRef.current;
    const label = labelRef.current;
    let active = true;
    let lastWidth = -1;
    const fit = () => {
      if (!active || !label.clientWidth) return;
      label.style.fontSize = 'inherit';
      let size = parseFloat(getComputedStyle(cell).fontSize);
      // Normal wrapping keeps whole words. Only a word wider than the cell
      // needs smaller type; other headings retain their original font size.
      for (let attempt = 0; attempt < 3 && label.scrollWidth > label.clientWidth; attempt++) {
        size *= (label.clientWidth - 1) / label.scrollWidth;
        label.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === lastWidth) return;
      lastWidth = entry.contentRect.width;
      fit();
    });
    observer.observe(cell);
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener('loadingdone', fit);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', fit);
    };
  }, [children, style?.fontSize, lang]);

  const wordBreak = /^(ja|zh)(-|$)/i.test(lang || '') ? 'normal' : 'keep-all';
  return <th {...props} lang={lang} ref={cellRef} style={{ ...style, wordBreak, overflowWrap: 'normal', hyphens: 'none', whiteSpace: 'pre-wrap' }}>
    <span ref={labelRef} data-document-heading style={{ display: 'block', wordBreak, overflowWrap: 'normal', hyphens: 'none' }}>{children}</span>
  </th>;
}
