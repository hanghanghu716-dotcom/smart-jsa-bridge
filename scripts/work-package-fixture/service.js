// Local UI fixture only. This module never connects to an account or uploads files.
export const files = new Map(),
  archives = [];
export async function assetBlob(path) {
  if (!files.has(path)) throw Error("Missing fixture");
  return files.get(path);
}
export async function archiveWorkOutput(id, run, pdf, drawings) {
  archives.push({
    id,
    run: structuredClone(run),
    pdf,
    drawings: structuredClone(drawings),
  });
  document.querySelector("#archive-status").textContent =
    `Archived locally: ${archives.length}; date: ${run.common.workDate}; PDF: ${pdf.size} bytes`;
  return { id };
}
