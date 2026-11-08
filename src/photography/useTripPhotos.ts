import { useCallback, useEffect, useState } from 'react';
import type { Trip } from '../trips/model';
import { journalRequest } from './api';
import type { DestinationPhoto, PhotoSelection, PhotoTarget } from './types';
import { parsePhotoSelections, photoStorageKey } from './photoStorage';
import { photographyStatus } from './usePhotographyStatus';
export function photoTargets(trip: Trip): PhotoTarget[] {
  return [{ slot: 'cover', label: 'Overall trip cover', destination: trip.destinations[0]?.photoQuery || trip.destinations[0]?.name || trip.name }, ...trip.destinations.map((d, i) => ({ slot: d.id || `destination-${i}`, label: d.name, destination: d.photoQuery || d.name }))];
}
const pendingSuggestions = new Map<string, Promise<{ photos: DestinationPhoto[] }>>();
function suggest(destination: string) {
  let pending = pendingSuggestions.get(destination);
  if (!pending) {
    pending = journalRequest<{ photos: DestinationPhoto[] }>(`/photos/search?destination=${encodeURIComponent(destination)}&page=1`).finally(() => pendingSuggestions.delete(destination));
    pendingSuggestions.set(destination, pending);
  }
  return pending;
}
export function useTripPhotos(trip: Trip) {
  const key = photoStorageKey(trip.id);
  const [selections, setSelections] = useState<PhotoSelection[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const read = useCallback(() => parsePhotoSelections(localStorage.getItem(key)), [key]);
  const save = useCallback(async (slot: string, photo: DestinationPhoto, onlyIfMissing = false) => {
    let latest: PhotoSelection[];
    try {
      latest = read();
      const previous = latest.find(item => item.slot === slot);
      if ((onlyIfMissing && previous) || (previous?.photo.id === photo.id && previous.photo.source === photo.source)) { setSelections(latest); return; }
      // Check storage before registering a selection; never claim it is saved when storage is blocked.
      localStorage.setItem(key, JSON.stringify(latest));
    } catch { throw new Error('This browser could not save your photograph selection. Check storage settings and try again.'); }
    const result = await journalRequest<{ photo: DestinationPhoto }>('/photos/select', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: photo.source, id: photo.id }),
    });
    let next: PhotoSelection[];
    try {
      latest = read();
      if (onlyIfMissing && latest.some(item => item.slot === slot)) { setSelections(latest); return; }
      next = [...latest.filter(item => item.slot !== slot), { slot, photo: result.photo }];
      localStorage.setItem(key, JSON.stringify(next));
    } catch { throw new Error('This browser could not save your photograph selection. Check storage settings and try again.'); }
    setSelections(next); setError('');
    window.dispatchEvent(new CustomEvent('journal-photographs-changed', { detail: trip.id }));
  }, [key, read, trip.id]);
  useEffect(() => {
    let active = true;
    const onChange = () => { try { if (active) setSelections(read()); } catch { /* original save action reports failures */ } };
    window.addEventListener('journal-photographs-changed', onChange);
    window.addEventListener('storage', onChange);
    const load = async () => {
      setError('');
      try {
        const current = read();
        if (active) setSelections(current);
        if (!trip.autoPhotography || photoTargets(trip).every(t => current.some(item => item.slot === t.slot))) return;
        if (active) setLoading(true);
        const config = await photographyStatus();
        if (!config.searchConfigured) throw new Error('Automatic photographs are not connected yet. Existing images and journal fallbacks are still available.');
        for (const target of photoTargets(trip)) {
          if (!active) return;
          if (!current.some(item => item.slot === target.slot)) {
            const { photos } = await suggest(target.destination);
            if (!active) return;
            if (photos[0]) await save(target.slot, photos[0], true);
            else setError('No photograph was found for one of your destinations. Choose Change photographs to try a city and country.');
          }
        }
      } catch (err) { if (active) setError((err as Error).message); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; window.removeEventListener('journal-photographs-changed', onChange); window.removeEventListener('storage', onChange); };
  }, [trip, read, save, retry]);
  return { photoFor: (slot: string) => selections.find(item => item.slot === slot)?.photo, save, retry: () => { void photographyStatus(true).finally(() => setRetry(v => v + 1)).catch(() => {}); }, error, loading };
}
