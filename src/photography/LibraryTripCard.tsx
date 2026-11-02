import type { Trip } from '../trips/model';
import { tripHref } from '../trips/model';
import { useTripPhotos } from './useTripPhotos';
import { JournalPhoto } from './Photo';
export function LibraryTripCard({ trip }: { trip: Trip }) {
  const photos = useTripPhotos(trip);
  return <article className="pj-created-trip"><div className="pj-created-trip-photo"><JournalPhoto photo={photos.photoFor('cover')} alt={trip.destinations[0]?.name || trip.name} /></div><a className="pj-created-trip-link" href={tripHref(trip.id)}><p className="eyebrow">A NEW CHAPTER · PLANNING</p><h3>{trip.name}</h3><p>{trip.destinations.map(d => d.name).join(' · ')}</p><p>{trip.startDate} — {trip.endDate} <span aria-hidden="true">↗</span></p></a></article>;
}
