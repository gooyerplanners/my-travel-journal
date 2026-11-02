import type { DestinationPhoto, PhotoSelection } from './types';
export const photoStorageKey = (tripId: string) => `my-travel-journal:photographs:${tripId}:v1`;
export function isDestinationPhoto(value: unknown): value is DestinationPhoto {
  if (!value || typeof value !== 'object') return false;
  const p = value as DestinationPhoto;
  const safeUrl = (url: unknown, host: string) => { try { const u = new URL(String(url)); return u.protocol === 'https:' && u.hostname === host; } catch { return false; } };
  return p.source === 'pexels' && typeof p.id === 'string' && /^\d{1,12}$/.test(p.id) &&
    typeof p.alt === 'string' && typeof p.width === 'number' && p.width > 0 && typeof p.height === 'number' && p.height > 0 &&
    safeUrl(p.url, 'images.pexels.com') && safeUrl(p.thumbnail, 'images.pexels.com') && typeof p.credit?.name === 'string' &&
    safeUrl(p.credit?.url, 'www.pexels.com') && safeUrl(p.credit?.providerUrl, 'www.pexels.com');
}
export function parsePhotoSelections(raw: string | null): PhotoSelection[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is PhotoSelection => typeof item?.slot === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(item.slot) && isDestinationPhoto(item.photo));
  } catch { return []; }
}
