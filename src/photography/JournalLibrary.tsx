import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Trip } from '../trips/model';
import { parseSavedTrips } from '../trips/createTrip';
interface JournalLibraryState { trips: Trip[]; addTrip: (trip: Trip) => void }
const LibraryContext = createContext<JournalLibraryState | null>(null);
const key = 'my-travel-journal:trips:v1';
export function JournalLibrary({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(() => {
    try { return parseSavedTrips(localStorage.getItem(key)); } catch { return []; }
  });
  function addTrip(trip: Trip) {
    const next = [...trips, trip];
    // Creation only succeeds when it can survive a refresh. Never pretend it is synced.
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { throw new Error('Your browser could not save this trip. Check storage settings and try again.'); }
    setTrips(next);
  }
  return <LibraryContext.Provider value={{ trips, addTrip }}>{children}</LibraryContext.Provider>;
}
export function useJournalLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('JournalLibrary provider is required.');
  return value;
}
