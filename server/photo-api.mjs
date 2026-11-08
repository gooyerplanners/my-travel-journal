import { EnvHttpProxyAgent, fetch as proxyFetch } from 'undici';
import { destinationQuery, normalizeUnsplash, downloadTrackingPath, validUnsplashId, PhotographyError } from './photography.mjs';
let proxyAgent;
function serverFetch(url, init) {
  // Honour the managed environment's proxy and CA trust. No secrets enter the browser.
  proxyAgent ??= new EnvHttpProxyAgent();
  return proxyFetch(url, { ...init, dispatcher: proxyAgent });
}
export function createPhotoApi({ env = process.env, fetcher = serverFetch, now = () => Date.now() } = {}) {
  const key = env.UNSPLASH_ACCESS_KEY;
  const cache = new Map();
  const pending = new Map();
  const limits = new Map();
  function rateLimit(id, limit) {
    const current = limits.get(id);
    if (!current || current.until < now()) {
      if (limits.size > 2000) for (const [key, entry] of limits) if (entry.until < now()) limits.delete(key);
      if (limits.size > 5000) throw new PhotographyError(429, 'The photo library is busy. Please try again later.');
      limits.set(id, { count: 1, until: now() + 3600_000 }); return;
    }
    if (++current.count > limit) throw new PhotographyError(429, 'A little pause is needed. Please try the photography library again later.');
  }
  async function provider(path, cacheable = true) {
    if (!key) throw new PhotographyError(503, 'Automatic photography is not connected yet. Add UNSPLASH_ACCESS_KEY as a server secret in environment settings.');
    const cached = cache.get(path);
    if (cacheable && cached && cached.until > now()) return cached.data;
    if (cacheable && pending.has(path)) return pending.get(path);
    const request = (async () => {
      rateLimit('provider', 40);
      let response;
      try { response = await fetcher(`https://api.unsplash.com${path}`, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' }, signal: AbortSignal.timeout(12_000), redirect: 'error' }); }
      catch { throw new PhotographyError(503, 'The photography service cannot be reached. Your existing photographs and fallbacks are still available.'); }
      if (!response.ok) { const limited = response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0'); throw new PhotographyError(limited ? 429 : 503, limited ? 'The photography library has reached its request limit. Please try again later.' : 'Destination photographs are temporarily unavailable. Check the Unsplash connection and try again.'); }
      let data;
      try { data = await response.json(); } catch { throw new PhotographyError(502, 'The photography provider returned an unreadable response.'); }
      if (cacheable) {
        if (cache.size >= 100) cache.delete(cache.keys().next().value);
        cache.set(path, { data, until: now() + 10 * 60_000 });
      }
      return data;
    })();
    if (cacheable) pending.set(path, request);
    try { return await request; } finally { if (cacheable) pending.delete(path); }
  }
  return async function photoApi(req, res, next = () => {}) {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/journal/')) return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (data, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    try {
      if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); throw new PhotographyError(405, 'This photography action is not supported.'); }
      // No CORS: the secret-bearing API is for this website, not other origins.
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new PhotographyError(403, 'Open your journal to browse destination photographs.');
      const path = url.pathname.slice('/api/journal'.length);
      if (path === '/status' && req.method === 'GET') return send({ searchConfigured: Boolean(key), provider: 'unsplash' });
      rateLimit(`client:${req.socket.remoteAddress}`, 120);
      if (path === '/photos/search' && req.method === 'GET') {
        const destination = destinationQuery(url.searchParams.get('destination'));
        const page = Number(url.searchParams.get('page') || 1);
        if (!Number.isInteger(page) || page < 1 || page > 20) throw new PhotographyError(400, 'Choose a valid photograph page.');
        const result = await provider(`/search/photos?query=${encodeURIComponent(destination)}&orientation=landscape&content_filter=high&per_page=12&page=${page}`);
        const rawPhotos = Array.isArray(result.results) ? result.results.filter(p => p && p.width >= 1000 && p.width > p.height) : [];
        const photos = rawPhotos.map(normalizeUnsplash);
        // Reuse canonical metadata for selection, avoiding another API call within the demo quota.
        for (const photo of rawPhotos) {
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(`/photos/${photo.id}`, { data: photo, until: now() + 10 * 60_000 });
        }
        return send({ photos, hasMore: page < Number(result.total_pages) && page < 20 });
      }
      if (path === '/photos/select' && req.method === 'POST') {
        const origin = req.headers.origin;
        let sameOrigin = false;
        try { sameOrigin = env.APP_ORIGIN ? origin === env.APP_ORIGIN : new URL(origin).host === req.headers.host; } catch { /* Reject absent or malformed origins. */ }
        if (!sameOrigin) throw new PhotographyError(403, 'Open your journal on its own website to choose a photograph.');
        if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new PhotographyError(415, 'Send a photograph selection as JSON.');
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 1024) throw new PhotographyError(413, 'This photograph selection is too large.'); }
        let selection; try { selection = JSON.parse(body); } catch { throw new PhotographyError(400, 'Choose a valid destination photograph.'); }
        const id = validUnsplashId(selection?.id);
        if (selection?.source !== 'unsplash') throw new PhotographyError(400, 'Choose a photograph from Unsplash.');
        const rawPhoto = await provider(`/photos/${id}`);
        if (rawPhoto.id !== id) throw new PhotographyError(502, 'Unsplash returned a different photograph. Please try again.');
        const photo = normalizeUnsplash(rawPhoto);
        // The canonical provider URL is validated; client-supplied tracking URLs are never followed.
        // Do not cache/deduplicate download events: each applied cover/destination counts separately.
        await provider(downloadTrackingPath(rawPhoto), false);
        return send({ photo });
      }
      const match = /^\/photos\/([A-Za-z0-9_-]{1,80})$/.exec(path);
      if (match && req.method === 'GET') return send(normalizeUnsplash(await provider(`/photos/${match[1]}`)));
      if (req.method === 'POST') throw new PhotographyError(405, 'Uploads are not available. Only destination photograph selections are supported.');
      throw new PhotographyError(404, 'This photography action is not available.');
    } catch (err) {
      if (err instanceof PhotographyError && err.status === 429) res.setHeader('Retry-After', '3600');
      // Never return raw upstream errors, tokens, response bodies, or credential-bearing URLs.
      send({ error: err instanceof PhotographyError ? err.message : 'The photography service is unavailable. Please try again later.' }, err instanceof PhotographyError ? err.status : 500);
    }
  };
}
