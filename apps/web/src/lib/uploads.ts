export function getUploadUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = process.env.NEXT_PUBLIC_BASE_UPLOAD_URL || process.env.BASE_UPLOAD_URL || '';
  if (!base) return path;
  // ensure no double slash
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export default getUploadUrl;
