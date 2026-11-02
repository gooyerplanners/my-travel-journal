import { EnvHttpProxyAgent, fetch as proxyFetch } from 'undici';
import { destinationQuery, normalizePexels, PhotographyError } from './photography.mjs';
let proxyAgent;
function serverFetch(url, init) {
  // Honour the managed environment's proxy and CA trust. No secrets enter the browser.
  proxyAgent ??= new EnvHttpProxyAgent();
  return proxyFetch(url, { ...init, dispatcher: proxyAgent });
}
export function createPhotoApi({ env = process.env, fetcher = serverFetch, now = () => Date.now() } = {}) {
  const key = env.PEXELS_API_KEY;
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
  async function provider(path) {
    if (!key) throw new PhotographyError(503, 'Automatic photography is not connected yet. Add PEXELS_API_KEY as a server secret in environment settings.');
    const cached = cache.get(path);
    if (cached && cached.until > now()) return cached.data;
    if (pending.has(path)) return pending.get(path);
    const request = (async () => {
      rateLimit('provider', 150);
      let response;
      try { response = await fetcher(`https://api.pexels.com/v1${path}`, { headers: { Authorization: key }, signal: AbortSignal.timeout(12_000), redirect: 'error' }); }
      catch { throw new PhotographyError(503, 'The photography service cannot be reached. Your existing photographs and fallbacks are still available.'); }
      if (!response.ok) throw new PhotographyError(response.status === 429 ? 429 : 503, response.status === 429 ? 'The photography library has reached its request limit. Please try again later.' : 'Destination photographs are temporarily unavailable. Check the photo connection and try again.');
      let data;
      try { data = await response.json(); } catch { throw new PhotographyError(502, 'The photography provider returned an unreadable response.'); }
      // Normalize before caching, so malformed upstream data is never saved or served.
      const result = path.startsWith('/search?')
        ? { photos: Array.isArray(data.photos) ? data.photos.filter(p => p.width >= 1000 && p.width > p.height).map(normalizePexels) : [], hasMore: Boolean(data.next_page) }
        : normalizePexels(data);
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(path, { data: result, until: now() + 10 * 60_000 });
      return result;
    })();
    pending.set(path, request);
    try { return await request; } finally { pending.delete(path); }
  }
  return async function photoApi(req, res, next = () => {}) {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/journal/')) return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (data, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    try {
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); throw new PhotographyError(405, 'The photography service accepts read-only requests. Uploads are not available.'); }
      // No CORS: the secret-bearing API is for this website, not other origins.
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new PhotographyError(403, 'Open your journal to browse destination photographs.');
      const path = url.pathname.slice('/api/journal'.length);
      if (path === '/status') return send({ searchConfigured: Boolean(key) });
      rateLimit(`client:${req.socket.remoteAddress}`, 120);
      if (path === '/photos/search') {
        const destination = destinationQuery(url.searchParams.get('destination'));
        const page = Number(url.searchParams.get('page') || 1);
        if (!Number.isInteger(page) || page < 1 || page > 20) throw new PhotographyError(400, 'Choose a valid photograph page.');
        const result = await provider(`/search?query=${encodeURIComponent(destination)}&orientation=landscape&size=large&per_page=12&page=${page}`);
        return send({ ...result, hasMore: result.hasMore && page < 20 });
      }
      const match = /^\/photos\/(\d{1,12})$/.exec(path);
      if (match) return send(await provider(`/photos/${match[1]}`));
      throw new PhotographyError(404, 'This photography action is not available.');
    } catch (err) {
      if (err instanceof PhotographyError && err.status === 429) res.setHeader('Retry-After', '3600');
      // Never return raw upstream errors, tokens, response bodies, or credential-bearing URLs.
      send({ error: err instanceof PhotographyError ? err.message : 'The photography service is unavailable. Please try again later.' }, err instanceof PhotographyError ? err.status : 500);
    }
  };
}
