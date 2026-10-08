import jsPDF from "jspdf";
import { captureReport } from "./captureReport";
import { normalizePaperSize, paperDimensions, paperPrintStyles } from './paperFormat';
// Both the existing JSA export and work packages share row-aware pagination.
export async function createReportPdf(papers) {
  if (!papers.length) throw Error("WORK_EMPTY");
  const doc = new jsPDF(
      papers[0].orientation === "portrait" ? "p" : "l",
      "mm",
      normalizePaperSize(papers[0].paperSize),
    ),
    images = [];
  for (const { element, orientation, paperSize } of papers) {
    if (element.getBoundingClientRect().height > 16000)
      throw Error("WORK_OUTPUT_LARGE");
    const canvas = await captureReport(element);
    if (!canvas.width || !canvas.height) throw Error("WORK_RENDER_FAILED");
    // html2canvas includes the paper's bottom padding. Do not turn trailing
    // white rows into an extra page after the last printable block.
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let contentHeight = canvas.height;
    trim: while (contentHeight > 1) {
      const start = (contentHeight - 1) * canvas.width * 4;
      for (let x = start; x < start + canvas.width * 4; x += 4) {
        if (pixels[x + 3] && (pixels[x] < 250 || pixels[x + 1] < 250 || pixels[x + 2] < 250)) break trim;
      }
      contentHeight--;
    }
    const landscape = orientation !== "portrait",
      { width: pw, height: ph } = paperDimensions(paperSize, orientation),
      margin = 10,
      contentWidth = pw - 20,
      scale = contentWidth / canvas.width;
    const pagePixels = Math.floor((ph - 20) / scale);
    const bounds = element.getBoundingClientRect(),
      pixelRatio = canvas.height / bounds.height,
      cuts = [...element.querySelectorAll("tr,[data-print-block]")]
        // Keep table headings with at least their first body row. A heading-only
        // cut strands the measurement columns at the foot of the previous page.
        .filter(el => el.tagName !== 'TR' || !el.closest('thead'))
        // A short attendance/measurement table should travel with its heading,
        // rather than leave a few unlabelled rows on the next page. Long tables
        // still break at row boundaries and cannot force a mostly empty page.
        .filter(el => {
          if (el.tagName !== 'TR') return true;
          const table = el.closest('table');
          return !table || table.getBoundingClientRect().height * pixelRatio > pagePixels * 0.4 ||
            el === table.rows[table.rows.length - 1];
        })
        .map((el) =>
          1 + Math.ceil(
            ((el.getBoundingClientRect().bottom - bounds.top) / bounds.height) *
              canvas.height,
          ),
        )
        .sort((a, b) => a - b);
    let y = 0;
    while (y < contentHeight) {
      if (images.length >= 100) throw Error("WORK_OUTPUT_LARGE");
      const max = Math.min(contentHeight, y + pagePixels);
      let end = max;
      if (max < contentHeight) {
        const candidates = cuts.filter((c) => c > y + 20 && c <= max);
        if (candidates.length) end = candidates[candidates.length - 1];
      }
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = end - y;
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(
        canvas,
        0,
        y,
        canvas.width,
        end - y,
        0,
        0,
        canvas.width,
        end - y,
      );
      const url = slice.toDataURL("image/jpeg", 0.94);
      if (images.length) doc.addPage(normalizePaperSize(paperSize), landscape ? "l" : "p");
      doc.addImage(
        url,
        "JPEG",
        margin,
        margin,
        contentWidth,
        slice.height * scale,
      );
      images.push({
        url,
        orientation: landscape ? "landscape" : "portrait",
        paperSize: normalizePaperSize(paperSize),
        width: contentWidth,
        height: slice.height * scale,
      });
      y = end;
      slice.width = 0;
      slice.height = 0;
    }
    canvas.width = 0;
    canvas.height = 0;
  }
  return { doc, blob: doc.output("blob"), images };
}
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function printReportImages(images) {
  const frame = document.createElement("iframe");
  frame.title = "Print work documents";
  frame.style.cssText =
    "position:fixed;left:-20000px;width:1200px;height:800px;border:0";
  document.body.appendChild(frame);
  const d = frame.contentDocument;
  d.open();
  d.write(
    `<!doctype html><html><head><title>Work documents</title><style>${paperPrintStyles()}body{margin:0}section{break-after:page}section:last-child{break-after:auto}img{display:block;max-width:100%}</style></head><body></body></html>`,
  );
  d.close();
  try {
    await Promise.all(
      images.map(
        (item) =>
          new Promise((resolve, reject) => {
            const section = d.createElement("section");
            section.style.page = `${normalizePaperSize(item.paperSize)}-${item.orientation === 'portrait' ? 'portrait' : 'landscape'}`;
            const img = d.createElement("img");
            img.style.width = item.width + "mm";
            img.style.height = item.height + "mm";
            img.onload = resolve;
            img.onerror = reject;
            img.src = item.url;
            section.append(img);
            d.body.append(section);
          }),
      ),
    );
    frame.contentWindow.focus();
    frame.contentWindow.print();
  } finally {
    setTimeout(() => frame.remove(), 60000);
  }
}
