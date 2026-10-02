import { assetBlob } from "../services/workPackageService";
let pdfModule;
async function pdfjs() {
  if (!pdfModule) {
    pdfModule = import("pdfjs-dist/legacy/build/pdf.mjs").then(async (m) => {
      const worker = await import(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"
      );
      m.GlobalWorkerOptions.workerSrc = worker.default;
      return m;
    });
  }
  return pdfModule;
}
const imageFromBlob = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob),
      image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(Error("WORK_FILE_INVALID"));
    };
    image.src = url;
  });
export async function inspectDrawing(file) {
  if (
    file.size > 20 * 1024 * 1024 ||
    !["application/pdf", "image/png", "image/jpeg"].includes(file.type)
  )
    throw Error("WORK_FILE_INVALID");
  if (file.type === "application/pdf") {
    const m = await pdfjs(),
      task = m.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        isEvalSupported: false,
      });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 200) throw Error("WORK_FILE_INVALID");
      return pdf.numPages;
    } finally {
      await task.destroy();
    }
  }
  const image = await imageFromBlob(file);
  if (image.width * image.height > 50000000) throw Error("WORK_FILE_INVALID");
  return 1;
}
export async function drawingPage(drawing, page, blob) {
  const source = blob || (await assetBlob(drawing.object_path)),
    canvas = document.createElement("canvas");
  if (drawing.mime_type === "application/pdf") {
    const m = await pdfjs(),
      task = m.getDocument({
        data: new Uint8Array(await source.arrayBuffer()),
        isEvalSupported: false,
      });
    try {
      const pdf = await task.promise,
        p = await pdf.getPage(page),
        base = p.getViewport({ scale: 1 }),
        scale = Math.min(2, 2200 / Math.max(base.width, base.height)),
        viewport = p.getViewport({ scale });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await p.render({ canvasContext: canvas.getContext("2d"), viewport })
        .promise;
    } finally {
      await task.destroy();
    }
  } else {
    const image = await imageFromBlob(source),
      scale = Math.min(1, 2200 / Math.max(image.width, image.height));
    canvas.width = Math.ceil(image.width * scale);
    canvas.height = Math.ceil(image.height * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}
export function paintAnnotations(canvas, shapes) {
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(canvas.width / 1000, canvas.height / 1000);
  for (const s of shapes || []) {
    ctx.save();
    ctx.globalAlpha = s.opacity ?? 1;
    ctx.strokeStyle = s.color || "#d62828";
    ctx.fillStyle = s.color || "#d62828";
    ctx.lineWidth = s.width || 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (s.type === "free") {
      (s.points || []).forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.stroke();
    }
    if (s.type === "line" || s.type === "arrow") {
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.stroke();
      if (s.type === "arrow") {
        const a = Math.atan2(s.h, s.w),
          l = 16;
        ctx.beginPath();
        ctx.moveTo(s.x + s.w, s.y + s.h);
        ctx.lineTo(
          s.x + s.w - l * Math.cos(a - 0.45),
          s.y + s.h - l * Math.sin(a - 0.45),
        );
        ctx.lineTo(
          s.x + s.w - l * Math.cos(a + 0.45),
          s.y + s.h - l * Math.sin(a + 0.45),
        );
        ctx.closePath();
        ctx.fill();
      }
    }
    if (s.type === "rect" || s.type === "zone") {
      ctx.rect(s.x, s.y, s.w, s.h);
      if (s.type === "zone") {
        ctx.save();
        ctx.globalAlpha *= 0.25;
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
    }
    if (s.type === "circle") {
      ctx.ellipse(
        s.x + s.w / 2,
        s.y + s.h / 2,
        Math.abs(s.w / 2),
        Math.abs(s.h / 2),
        0,
        0,
        2 * Math.PI,
      );
      ctx.stroke();
    }
    if (s.type === "text") {
      ctx.translate(s.x, s.y);
      ctx.scale(1, canvas.width / canvas.height);
      ctx.font = `${Math.max(10, s.fontSize || 24)}px sans-serif`;
      ctx.textBaseline = "top";
      String(s.text || "")
        .split("\n")
        .forEach((line, i) =>
          ctx.fillText(line, 0, i * (s.fontSize || 24) * 1.3),
        );
    }
    if (s.type === "marker") {
      ctx.translate(s.x, s.y);
      ctx.scale(1, canvas.width / canvas.height);
      ctx.arc(0, 0, (s.fontSize || 24) * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${(s.fontSize || 24) * 0.9}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(s.text || "1"), 0, 0);
    }
    ctx.restore();
  }
  ctx.restore();
  return canvas;
}
