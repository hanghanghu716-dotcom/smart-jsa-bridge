export function pageWindow(current, total, size = 15) {
  const count = Math.max(0, Math.floor(Number(total) || 0));
  const page = Math.min(Math.max(1, Math.floor(Number(current) || 1)), Math.max(1, count));
  const width = Math.max(1, Math.floor(Number(size) || 15));
  const start = Math.floor((page - 1) / width) * width + 1;
  const end = Math.min(start + width - 1, count);
  return { page, count, start, end, pages: Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i) };
}
