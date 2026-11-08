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

export function validUnsplashId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new PhotographyError(400, 'Choose a valid destination photograph.');
  return value;
}
function unsplashUrl(value, host) {
  try {
    const url = new URL(value);
    if (url.origin === `https://${host}` && !url.username && !url.password) return url;
  } catch { /* Only provider-owned URLs are allowed. */ }
  throw new PhotographyError(502, 'Unsplash returned an unavailable photograph.');
}
function referralUrl(value) {
  const url = unsplashUrl(value, 'unsplash.com');
  url.searchParams.set('utm_source', 'my_travel_journal');
  url.searchParams.set('utm_medium', 'referral');
  return url.href;
}
export function normalizeUnsplash(photo) {
  validUnsplashId(photo.id);
  if (!Number.isFinite(photo.width) || !Number.isFinite(photo.height) || photo.width < 1 || photo.height < 1 || typeof photo.user?.name !== 'string') throw new PhotographyError(502, 'Unsplash returned an unavailable photograph.');
  const image = unsplashUrl(photo.urls?.regular, 'images.unsplash.com');
  // Preserve provider tracking parameters, including ixid, when resizing hotlinked images.
  image.searchParams.set('w', '1920');
  image.searchParams.set('q', '85');
  image.searchParams.set('fit', 'max');
  image.searchParams.set('auto', 'format');
  return {
    source: 'unsplash', id: photo.id,
    url: image.href, thumbnail: unsplashUrl(photo.urls?.small, 'images.unsplash.com').href,
    alt: String(photo.alt_description || photo.description || 'Destination photograph').slice(0, 500),
    width: photo.width, height: photo.height,
    credit: { name: photo.user.name.slice(0, 200), url: referralUrl(photo.user.links?.html), providerUrl: referralUrl(photo.links?.html) },
  };
}
export function downloadTrackingPath(photo) {
  const id = validUnsplashId(photo.id);
  const url = unsplashUrl(photo.links?.download_location, 'api.unsplash.com');
  if (url.pathname !== `/photos/${id}/download`) throw new PhotographyError(502, 'Unsplash could not register this photograph selection. Please try another view.');
  return url.pathname + url.search;
}
