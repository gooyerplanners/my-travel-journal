import { useState } from 'react';
import { PhotoDialog } from './PhotoDialog';
import { useJournalLibrary } from './JournalLibrary';
import { tripHref } from '../trips/model';
import { createTrip } from '../trips/createTrip';
export function CreateTrip({ onClose }: { onClose: () => void }) {
  const { addTrip } = useJournalLibrary();
  const [message, setMessage] = useState('');
  return <PhotoDialog title="A new adventure is calling." onClose={onClose}><form className="pj-create-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const trip = createTrip({ name: data.get('name'), startDate: data.get('startDate'), endDate: data.get('endDate'), timeZone: data.get('timeZone'), destinations: String(data.get('destinations')).split('\n').map(name => name.trim()).filter(Boolean) });
      addTrip(trip); onClose(); window.location.hash = tripHref(trip.id);
    } catch (err) { setMessage((err as Error).message); }
  }}><p className="pj-muted">Start with the places you dream of. We’ll automatically suggest a photograph for your trip and each destination, with room to change every view.</p><label>Trip name<input name="name" required maxLength={100} placeholder="A little escape to Japan" /></label><div className="pj-date-inputs"><label>Departure date<input type="date" name="startDate" required /></label><label>Return date<input type="date" name="endDate" required /></label></div><label>Destinations — one per line<textarea name="destinations" required maxLength={1200} rows={3} placeholder={'Kyoto, Japan\nNara, Japan'} /></label><p className="pj-fine">Include a country for better photo suggestions. Up to 8 destinations. Daily schedules and overnight stays can be planned later.</p><label>Trip timezone<input name="timeZone" required defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} placeholder="Europe/Madrid" /></label><p className="pj-fine">Use the local timezone for your trip, such as Europe/Madrid or Asia/Tokyo. Trips and selected photo references are saved in this browser only. Account syncing and Travel Notes uploads will come later.</p><button className="td-button">Create trip & suggest photographs</button><p className="pj-message" role="status">{message}</p></form></PhotoDialog>;
}
