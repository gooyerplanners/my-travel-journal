export class PhotographyError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function destinationQuery(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 120 || /[\x00-\x1f]/.test(value)) throw new PhotographyError(400, 'Enter a destination of up to 120 characters.');
  return value.trim();
}
export function normalizePexels(photo) {
  function safeUrl(value, host) {
    try { const url = new URL(value); if (url.protocol === 'https:' && url.hostname === host && !url.username && !url.password) return url.href; } catch { /* reject invalid provider data */ }
    throw new PhotographyError(502, 'The photography provider returned an unavailable photograph.');
  }
  if (!Number.isSafeInteger(photo.id) || photo.id < 1 || !photo.src || !Number.isFinite(photo.width) || !Number.isFinite(photo.height) || photo.width < 1 || photo.height < 1 || typeof photo.photographer !== 'string') throw new PhotographyError(502, 'The photography provider returned an unavailable photograph.');
  return {
    source: 'pexels', id: String(photo.id),
    url: safeUrl(photo.src.large2x || photo.src.large, 'images.pexels.com'),
    thumbnail: safeUrl(photo.src.medium, 'images.pexels.com'),
    alt: typeof photo.alt === 'string' ? photo.alt.slice(0, 500) : 'Destination photograph',
    width: photo.width, height: photo.height,
    credit: { name: photo.photographer.slice(0, 200), url: safeUrl(photo.photographer_url, 'www.pexels.com'), providerUrl: safeUrl(photo.url, 'www.pexels.com') },
  };
}
