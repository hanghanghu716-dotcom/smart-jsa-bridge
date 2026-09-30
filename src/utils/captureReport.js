import html2canvas from 'html2canvas';

export async function captureReport(paper) {
  await document.fonts.ready;
  const metricsStyle = document.createElement('style');
  // html2canvas 1.4 measures font baselines with a hidden image in the live
  // document, not its cloned document. Tailwind's block images move that probe
  // onto a new line. Only restore inline layout for these temporary probes;
  // report photos and the visible application keep their original styles.
  metricsStyle.textContent = 'body > div[style*="visibility: hidden"] > img { display: inline-block !important; }';
  document.head.appendChild(metricsStyle);
  try {
    return await html2canvas(paper, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff',
      logging: false, imageTimeout: 0, scrollY: 0
    });
  } finally {
    metricsStyle.remove();
  }
}
