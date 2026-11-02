import { useEffect, useState } from 'react';
import type { DestinationPhoto } from './types';
export function PhotoCredit({ photo }: { photo?: DestinationPhoto }) {
  if (!photo?.credit) return null;
  return <span className="pj-credit">Photo by <a href={photo.credit.url} target="_blank" rel="noopener noreferrer">{photo.credit.name}</a> on <a href={photo.credit.providerUrl} target="_blank" rel="noopener noreferrer">Pexels</a></span>;
}
export function JournalPhoto({ photo, fallbackUrl, alt, eager = false, showCredit = true }: { photo?: DestinationPhoto; fallbackUrl?: string; alt: string; eager?: boolean; showCredit?: boolean }) {
  const src = photo?.url || fallbackUrl;
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(src ? 'loading' : 'failed');
  useEffect(() => setState(src ? 'loading' : 'failed'), [src]);
  return <><div className={`pj-image-state pj-image-${state}`} aria-hidden="true">{state === 'loading' && <span className="pj-photo-loading">Finding the light…</span>}{state === 'failed' && <span className="pj-photo-fallback">{alt}</span>}</div>{src && state !== 'failed' && <img src={src} alt={photo?.alt || alt} loading={eager ? 'eager' : 'lazy'} onLoad={() => setState('ready')} onError={() => setState('failed')} />}{showCredit && <PhotoCredit photo={photo} />}</>;
}
