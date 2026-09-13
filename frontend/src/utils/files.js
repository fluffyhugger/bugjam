export function fileIcon(mimeType = "", filename = "") {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(filename)) return "📕";
  if (mimeType.startsWith("text/") || /\.(log|txt|csv|json)$/i.test(filename)) return "📄";
  return "📎";
}

export const isImage = (mimeType = "", filename = "") =>
  mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)$/i.test(filename);

export function formatBytes(bytes = 0) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
