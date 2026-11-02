import type { Trip } from './model';
function text(value: unknown, label: string, max = 120): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`Enter a valid ${label}.`);
  return value.trim();
}
export function createTrip(input: { name: unknown; startDate: unknown; endDate: unknown; timeZone: unknown; destinations: unknown }, id = crypto.randomUUID()): Trip {
  const name = text(input.name, 'trip name', 100);
  const startDate = text(input.startDate, 'departure date');
  const endDate = text(input.endDate, 'return date');
  for (const date of [startDate, endDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Choose valid departure and return dates.');
  }
  if (endDate < startDate) throw new Error('Your return date must be on or after departure.');
  const timeZone = text(input.timeZone, 'trip timezone', 80);
  try { new Intl.DateTimeFormat('en', { timeZone }).format(); } catch { throw new Error('Use a valid trip timezone, such as Europe/Madrid.'); }
  if (!Array.isArray(input.destinations) || input.destinations.length < 1 || input.destinations.length > 8) throw new Error('Choose between 1 and 8 destinations.');
  const names = input.destinations.map(d => text(d, 'destination'));
  if (new Set(names.map(n => n.toLowerCase())).size !== names.length) throw new Error('List each destination once.');
  return {
    id, name, startDate, endDate, timeZone, nights: Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000),
    status: 'Planning', autoPhotography: true,
    destinations: names.map((name, i) => ({ id: `destination-${i}`, name, description: 'A new place, a new perspective. Leave a little room to discover.', kind: 'Destination', image: '', alt: name })),
  };
}
export function parseSavedTrips(raw: string | null): Trip[] {
  try {
    const data: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.slice(0, 100).flatMap(item => {
      try {
        if (typeof item?.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || !Array.isArray(item.destinations)) return [];
        return [createTrip({ ...item, destinations: item.destinations.map((d: { name: string }) => d.name) }, item.id)];
      } catch { return []; }
    });
  } catch { return []; }
}
