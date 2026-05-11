// Decode a base64 data URL into a Buffer + MIME type for streaming.
export function decodeDataUrl(src: string | undefined | null) {
  if (!src || typeof src !== 'string') return null;
  const m = /^data:([^;,]+)(?:;([^,]+))?,(.+)$/.exec(src);
  if (!m) return null;
  const mime = m[1] || 'application/octet-stream';
  const params = m[2] || '';
  const payload = m[3];
  const isBase64 = /(^|;)base64($|;)/i.test(params);
  try {
    const data = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload));
    return { mime, data };
  } catch {
    return null;
  }
}

export const IMAGE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable, s-maxage=31536000',
};
