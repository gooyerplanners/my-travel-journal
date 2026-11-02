export type PlanningTaskId = 'flights' | 'accommodation' | 'transport' | 'attractions' | 'insurance' | 'preparation';
export type TripSection = 'overview' | 'itinerary' | 'saved-places' | 'budget' | 'bookings' | 'packing-list' | 'travel-notes';
export interface Destination {
  name: string;
  description: string;
  image: string;
  alt: string;
  kind: 'City' | 'Excursion from Barcelona';
}
export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  nights: number;
  status: 'Planning';
  destinations: Destination[];
}
export interface TripProgress {
  completed: PlanningTaskId[];
  budgetTarget: number | null;
}
export const planningTasks: { id: PlanningTaskId; label: string; hint: string }[] = [
  { id: 'flights', label: 'Flights', hint: 'Find your way there and home again.' },
  { id: 'accommodation', label: 'Accommodation', hint: 'Somewhere lovely to return to.' },
  { id: 'transport', label: 'Transportation between cities', hint: 'Make room for the journey in between.' },
  { id: 'attractions', label: 'Attraction reservations', hint: 'A little foresight for the places you love.' },
  { id: 'insurance', label: 'Travel insurance', hint: 'A little peace of mind, packed.' },
  { id: 'preparation', label: 'General preparation', hint: 'Documents, details, and the little essentials.' },
];
export const sections: { id: TripSection; label: string; description: string }[] = [
  { id: 'overview', label: 'Overview', description: 'The beginnings of a beautiful journey.' },
  { id: 'itinerary', label: 'Itinerary', description: 'Five days, with room to wander.' },
  { id: 'saved-places', label: 'Saved Places', description: 'Little places worth a detour.' },
  { id: 'budget', label: 'Budget', description: 'Make room for memories.' },
  { id: 'bookings', label: 'Bookings', description: 'The details that bring it all together.' },
  { id: 'packing-list', label: 'Packing List', description: 'Bring the essentials. Leave room for stories.' },
  { id: 'travel-notes', label: 'Travel Notes', description: 'Keep every little detail.' },
];
export const spainTrip: Trip = {
  id: 'spain-2027', name: 'Spain 2027', startDate: '2027-02-15', endDate: '2027-02-19',
  timeZone: 'Europe/Madrid', nights: 4, status: 'Planning',
  destinations: [
    { name: 'Madrid', kind: 'City', description: 'Grand boulevards, art-filled afternoons, and a table that invites you to linger.', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=900&q=80', alt: 'Madrid city rooftops in the evening light' },
    { name: 'Barcelona', kind: 'City', description: 'Winding streets. Long lunches. A city to get lost in.', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80', alt: 'Barcelona skyline and the Sagrada Família' },
    { name: 'Montserrat', kind: 'Excursion from Barcelona', description: 'A little higher, a little quieter. Mountain paths and a monastery among the peaks.', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monestir%20de%20Montserrat.jpg?width=900', alt: 'Montserrat mountain landscape and monastery' },
  ],
};
const dayMs = 86_400_000;
export function dateOrdinal(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / dayMs;
}
export function calendarDays(trip: Trip): number {
  return dateOrdinal(trip.endDate) - dateOrdinal(trip.startDate) + 1;
}
export function tripTiming(trip: Trip, now = new Date()): { label: string; value: string; detail: string } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: trip.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  const today = dateOrdinal(`${part('year')}-${part('month')}-${part('day')}`);
  const start = dateOrdinal(trip.startDate);
  const end = dateOrdinal(trip.endDate);
  if (today < start) {
    const days = start - today;
    return { label: 'UNTIL DEPARTURE', value: `${days} ${days === 1 ? 'day' : 'days'}`, detail: 'A little closer to somewhere wonderful.' };
  }
  if (today <= end) return { label: 'YOUR JOURNEY IS HERE', value: 'In progress', detail: `Day ${today - start + 1} of ${calendarDays(trip)}. Take it all in.` };
  return { label: 'A CHAPTER TO REMEMBER', value: 'Completed', detail: 'The journey ends. The stories stay.' };
}
export function emptyProgress(): TripProgress { return { completed: [], budgetTarget: null }; }
export function parseProgress(raw: string | null): TripProgress {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return emptyProgress();
    const state = value as Record<string, unknown>;
    const completed = Array.isArray(state.completed)
      ? planningTasks.filter(task => (state.completed as unknown[]).includes(task.id)).map(task => task.id)
      : [];
    const budgetTarget = typeof state.budgetTarget === 'number' && Number.isFinite(state.budgetTarget) && state.budgetTarget >= 0 && state.budgetTarget <= 1e12 ? state.budgetTarget : null;
    return { completed, budgetTarget };
  } catch { return emptyProgress(); }
}
export function progressKey(tripId: string) { return `my-travel-journal:trip:${tripId}:v1`; }
export function tripHref(tripId: string, section: TripSection = 'overview') { return `#/trips/${encodeURIComponent(tripId)}/${section}`; }
export function tripRoute(hash: string): { tripId: string; section: TripSection } | null {
  const match = /^#\/trips\/([^/]+)(?:\/([^/]+))?$/.exec(hash);
  if (!match) return null;
  try {
    return { tripId: decodeURIComponent(match[1]), section: sections.find(s => s.id === match[2])?.id ?? 'overview' };
  } catch { return null; }
}
