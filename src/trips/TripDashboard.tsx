import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { calendarDays, planningTasks, sections, tripHref, tripTiming } from './model';
import type { Destination, Trip, TripProgress, TripSection } from './model';
import { useTripProgress } from './useTripProgress';
import './trip.css';

function JournalCard({ eyebrow, title, children, className = '' }: { eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return <section className={`td-card ${className}`}><p className="td-eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</section>;
}
function DestinationCard({ destination }: { destination: Destination }) {
  const [failed, setFailed] = useState(false);
  return <article className="td-destination"><div className="td-destination-photo">{!failed && <img src={destination.image} alt={destination.alt} loading="lazy" onError={() => setFailed(true)} />}{failed && <span className="td-photo-fallback">{destination.name}</span>}<span className="td-destination-kind">{destination.kind}</span></div><div className="td-destination-copy"><h3>{destination.name}</h3><p>{destination.description}</p></div></article>;
}
function PlanningChecklist({ progress, onChange }: { progress: TripProgress; onChange: (next: TripProgress) => boolean }) {
  return <JournalCard eyebrow="ONE LITTLE STEP AT A TIME" title="A little preparation"><div className="td-checklist-progress"><span>{progress.completed.length} of {planningTasks.length} complete</span><progress value={progress.completed.length} max={planningTasks.length} aria-label="Planning checklist progress" /></div><div className="td-checklist">{planningTasks.map(task => <label key={task.id} className="td-check-item"><input type="checkbox" checked={progress.completed.includes(task.id)} onChange={event => onChange({ ...progress, completed: event.target.checked ? [...progress.completed, task.id] : progress.completed.filter(id => id !== task.id) })} /><span><strong>{task.label}</strong><small>{task.hint}</small></span></label>)}</div><p className="td-fine-print">Your checklist records preparation only. Checking an item does not create or confirm a booking.</p></JournalCard>;
}
function BudgetCard({ progress, onChange }: { progress: TripProgress; onChange: (next: TripProgress) => boolean }) {
  const [draft, setDraft] = useState(progress.budgetTarget === null ? '' : String(progress.budgetTarget));
  const [message, setMessage] = useState('');
  const hasBudget = progress.budgetTarget !== null;
  return <JournalCard eyebrow="MAKE ROOM FOR MEMORIES" title="Your trip budget"><p className="td-budget-amount">{hasBudget ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(progress.budgetTarget!) : 'A little room to dream.'}</p><p className="td-muted">{hasBudget ? 'Your budget target · EUR. No expenses or payments recorded.' : 'No budget target yet. Start with an amount that feels right for you.'}</p><form className="td-budget-form" onSubmit={event => {
    event.preventDefault();
    const value = draft.trim() === '' ? null : Number(draft);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1e12 || Math.abs(value * 100 - Math.round(value * 100)) > .001)) {
      setMessage('Enter a non-negative amount with up to two decimal places.'); return;
    }
    const saved = onChange({ ...progress, budgetTarget: value });
    setMessage(saved ? value === null ? 'Budget target cleared.' : 'Budget target saved on this device.' : 'Target updated for this visit. Local saving is unavailable.');
  }}><label htmlFor="trip-budget">Budget target (EUR)</label><div className="td-budget-controls"><span aria-hidden="true">€</span><input id="trip-budget" name="budget" type="number" inputMode="decimal" min="0" max="1000000000000" step="0.01" value={draft} placeholder="Enter a target" onChange={event => { setDraft(event.target.value); setMessage(''); }} /><button className="td-button" type="submit">Save target</button></div><p className="td-fine-print">Leave the amount blank and save to clear your target.</p><p className="td-form-message" role="status">{message}</p></form></JournalCard>;
}
function BookingsCard() {
  return <JournalCard eyebrow="THE DETAILS WILL FOLLOW" title="Upcoming bookings"><div className="td-empty-mark" aria-hidden="true">✧</div><h3>Nothing booked. Everything possible.</h3><p className="td-muted">Your flights and accommodation are not yet booked. No reservations, confirmed schedules, or payments have been added.</p><div className="td-booking-status"><span>Flights <strong>Not yet booked</strong></span><span>Accommodation <strong>Not yet booked</strong></span></div><p className="td-fine-print">Booking entry will arrive in a later phase. This space will hold your plans when they become real.</p></JournalCard>;
}
function Placeholder({ section, trip }: { section: TripSection; trip: Trip }) {
  const item = sections.find(item => item.id === section)!;
  const detail: Partial<Record<TripSection, string>> = {
    itinerary: 'The itinerary workspace is coming in the next phase. No daily schedule has been set. Montserrat is an excursion from Barcelona, with no separate overnight stay.',
    'saved-places': 'A dedicated collection for this trip will arrive in a later phase. No trip-specific places have been saved yet.',
    'packing-list': 'Your packing workspace will arrive in a later phase. No packing items have been added yet.',
    'travel-notes': 'Your travel notebook will arrive in a later phase. No notes have been added yet.',
  };
  return <JournalCard eyebrow="A CHAPTER STILL TO COME" title={item.label} className="td-placeholder"><span className="td-empty-mark" aria-hidden="true">✧</span><h3>{item.description}</h3><p className="td-muted">{detail[section]}</p><span className="td-coming-label">{section === 'itinerary' ? 'Coming in the next phase' : 'Placeholder · not available yet'}</span><a className="td-button td-outline" href={tripHref(trip.id)}>Back to trip overview <span aria-hidden="true">↗</span></a></JournalCard>;
}
export function TripDashboard({ trip, section }: { trip: Trip; section: TripSection }) {
  const { progress, updateProgress, storageError } = useTripProgress(trip.id);
  const [now, setNow] = useState(() => new Date());
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    const refresh = () => setNow(new Date());
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => { window.scrollTo(0, 0); heading.current?.focus({ preventScroll: true }); }, [trip.id, section]);
  const timing = tripTiming(trip, now);
  const start = new Date(`${trip.startDate}T12:00:00Z`);
  const end = new Date(`${trip.endDate}T12:00:00Z`);
  const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: trip.timeZone });
  return <div className="trip-dashboard"><div className="td-topbar"><a className="td-wordmark" href="#home"><span aria-hidden="true">✧</span> My Travel Journal</a><a className="td-home-link" href="#home">← Back to homepage</a></div><main className="td-main">
    <header className="td-header"><p className="td-eyebrow">EVERY JOURNEY HAS A STORY</p><div className="td-title-line"><h1 ref={heading} tabIndex={-1}>{trip.name}</h1><span className="td-status">{trip.status}</span></div><p className="td-date-range"><time dateTime={trip.startDate}>{dateFormat.format(start)}</time><span aria-hidden="true"> — </span><time dateTime={trip.endDate}>{dateFormat.format(end)}</time></p><p className="td-trip-meta">{calendarDays(trip)} calendar days · {trip.nights} nights <span>Madrid · Barcelona · Montserrat</span></p></header>
    <section className="td-cover" aria-label="Spain trip photograph"><img src="https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1800&q=85" alt="Warm evening light over Madrid" onError={e => { e.currentTarget.style.display = 'none'; }} /><div className="td-cover-shade" /><div className="td-cover-copy"><p className="td-eyebrow">THREE PLACES. ONE BEAUTIFUL CHAPTER.</p><h2>A little art. A little altitude.<br />A lot to remember.</h2><p>Madrid to Barcelona, with a mountain escape in mind.</p></div><div className="td-countdown" aria-live="polite"><p>{timing.label}</p><strong>{timing.value}</strong><span>{timing.detail}</span><small>Calendar days · Spain local time</small></div></section>
    <nav className="td-tabs" aria-label="Spain trip navigation">{sections.map(item => <a href={tripHref(trip.id, item.id)} key={item.id} aria-current={section === item.id ? 'page' : undefined}>{item.label}</a>)}</nav>
    {storageError && <p className="td-storage-notice" role="status">{storageError}</p>}
    {section === 'overview' ? <>
      <section className="td-destinations" aria-labelledby="td-destinations-title"><div className="td-section-heading"><div><p className="td-eyebrow">PLACES TO FALL A LITTLE IN LOVE WITH</p><h2 id="td-destinations-title">The shape of your journey</h2></div><p>Two cities. One mountain escape.</p></div><div className="td-destination-grid">{trip.destinations.map(destination => <DestinationCard destination={destination} key={destination.name} />)}</div><p className="td-destination-note">Montserrat is a planned excursion from Barcelona, not a separate overnight destination. City stays and travel arrangements are still to be decided.</p></section>
      <section className="td-itinerary-entry"><div><p className="td-eyebrow">FIVE DAYS, WITH ROOM TO WANDER</p><h2>Let the days take shape.</h2><p>Your itinerary begins here. The day-by-day planner is coming in the next phase.</p></div><a href={tripHref(trip.id, 'itinerary')} className="td-button">Explore your itinerary <span aria-hidden="true">→</span></a></section>
      <section aria-labelledby="td-planning-title"><div className="td-section-heading"><div><p className="td-eyebrow">THE DETAILS THAT MAKE IT YOURS</p><h2 id="td-planning-title">Your planning journal</h2></div></div><div className="td-planning-grid">{sections.filter(item => item.id !== 'overview').map((item, index) => <a className="td-planning-link" key={item.id} href={tripHref(trip.id, item.id)}><span className="td-planning-number">0{index + 1}</span><h3>{item.label}</h3><p>{item.description}</p><small>{item.id === 'budget' ? 'Edit your target' : item.id === 'bookings' ? 'Not yet booked' : 'Coming soon'}</small><span className="td-planning-arrow" aria-hidden="true">↗</span></a>)}</div></section>
      <div className="td-overview-grid"><PlanningChecklist progress={progress} onChange={updateProgress} /><div className="td-summary-stack"><BudgetCard progress={progress} onChange={updateProgress} /><BookingsCard /></div></div>
    </> : section === 'budget' ? <BudgetCard progress={progress} onChange={updateProgress} /> : section === 'bookings' ? <BookingsCard /> : <Placeholder section={section} trip={trip} />}
    <footer className="td-footer"><span>Some journeys take us far from home. Some bring us closer.</span><small>Saved on this browser only · no cloud syncing</small><a href="#home">← Back to your journal</a></footer>
  </main></div>;
}
