import { useEffect, useRef, useState } from 'react';
import { journalRequest } from './api';
import { usePhotographyStatus } from './usePhotographyStatus';
import { PhotoDialog } from './PhotoDialog';
import { JournalPhoto, PhotoCredit } from './Photo';
import type { DestinationPhoto, PhotoTarget } from './types';
interface SearchResults { photos: DestinationPhoto[]; hasMore: boolean }
export function PhotoPicker({ targets, onClose, onSelect }: { targets: PhotoTarget[]; onClose: () => void; onSelect: (slot: string, photo: DestinationPhoto) => Promise<void> }) {
  const [target, setTarget] = useState(targets[0]);
  const connection = usePhotographyStatus();
  return <PhotoDialog title="Find the feeling." onClose={onClose}>
    <label className="pj-target-label">Photograph for<select value={target.slot} onChange={e => setTarget(targets.find(t => t.slot === e.target.value)!)}>{targets.map(t => <option key={t.slot} value={t.slot}>{t.label}</option>)}</select></label>
    {connection.loading ? <p className="pj-notice" role="status">Opening the destination photography library…</p> : connection.error || !connection.status.searchConfigured ? <div className="pj-empty"><h3>A view worth waiting for.</h3><p>{connection.error || 'Automatic photography needs a free Pexels API connection. Your journal remains available with its existing photographs and fallbacks.'}</p><p>In your browser, create a free key at <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer">Pexels API</a>, then add it as the server secret PEXELS_API_KEY in environment settings. No software installation is needed.</p><button className="td-button td-outline" onClick={() => void connection.refresh()}>Check connection again</button></div> : <PhotoPickerContent key={target.slot} target={target} onSelect={onSelect} />}
  </PhotoDialog>;
}
function PhotoPickerContent({ target, onSelect }: { target: PhotoTarget; onSelect: (slot: string, photo: DestinationPhoto) => Promise<void> }) {
  const [query, setQuery] = useState(target.destination);
  const [search, setSearch] = useState(target.destination);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResults>({ photos: [], hasMore: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<DestinationPhoto | null>(null);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setMessage(''); setSelected(null);
    journalRequest<SearchResults>(`/photos/search?destination=${encodeURIComponent(search)}&page=${page}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(err => { if (!controller.signal.aborted) { setMessage(err.message); setResult({ photos: [], hasMore: false }); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, page, retry]);
  async function choose(photo: DestinationPhoto) {
    setSaving(true); setMessage('');
    try {
      await onSelect(target.slot, photo);
      if (mounted.current) { setSelected(photo); setMessage(`Photograph saved for ${target.label} in this browser.`); }
    } catch (err) { if (mounted.current) setMessage((err as Error).message); }
    finally { if (mounted.current) setSaving(false); }
  }
  return <div className="pj-picker-content" aria-busy={saving}>
    <p className="pj-muted">A suggestion for {target.destination}. Choose the view that feels like your journey. Selected references stay in this browser; no personal photos are uploaded.</p>
    <form className="pj-search" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(query.trim()); setRetry(v => v + 1); }}><label htmlFor="pj-query">Search destination photographs</label><div><input id="pj-query" value={query} maxLength={120} required onChange={e => setQuery(e.target.value)} /><button className="td-button" disabled={loading || saving}>Find photographs</button></div></form>
    {loading ? <div className="pj-skeleton-grid" role="status" aria-label="Finding destination photographs">{[1, 2, 3, 4].map(i => <div key={i} />)}</div> : <div className="pj-results">{result.photos.map((photo, i) => <article key={photo.id}><button className={`pj-photo-choice ${selected?.id === photo.id ? 'is-selected' : ''}`} aria-label={`Choose photograph ${i + 1}: ${photo.alt}`} disabled={saving} onClick={() => void choose(photo)}><div><JournalPhoto photo={photo} alt={photo.alt} showCredit={false} /></div><span>{selected?.id === photo.id ? 'Selected' : i === 0 && page === 1 ? 'Suggested photograph' : 'Choose this view'} <span aria-hidden="true">↗</span></span></button><PhotoCredit photo={photo} /></article>)}</div>}
    {!loading && result.photos.length === 0 && <p className="pj-empty-text">No photographs to show. Try a nearby city or include a country.</p>}
    <div className="pj-pagination"><button className="td-button td-outline" disabled={page === 1 || loading || saving} onClick={() => setPage(p => p - 1)}>Previous views</button><span>Page {page}</span><button className="td-button td-outline" disabled={!result.hasMore || loading || saving} onClick={() => setPage(p => p + 1)}>More photographs</button></div>
    <p className="pj-message" role="status">{message || (saving ? 'Saving your selection…' : '')}</p>
    <p className="pj-fine">Photography supplied by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a> under the <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">Pexels licence</a>. Photographs are suggested, not guaranteed to show the exact destination; refine your search if a view does not fit.</p>
  </div>;
}
