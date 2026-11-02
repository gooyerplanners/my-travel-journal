import { StrictMode, useEffect, useState } from 'react';
import { TripDashboard } from './trips/TripDashboard';
import { spainTrip, tripHref, tripRoute } from './trips/model';
import { createRoot } from 'react-dom/client';
import './style.css';
import { JournalLibrary, useJournalLibrary } from './photography/JournalLibrary';
import { CreateTrip } from './photography/CreateTrip';
import { LibraryTripCard } from './photography/LibraryTripCard';
import { useTripPhotos } from './photography/useTripPhotos';
import { JournalPhoto, PhotoCredit } from './photography/Photo';

type IconName = 'home' | 'compass' | 'heart' | 'note' | 'wallet' | 'bag' | 'plus' | 'arrow' | 'pin' | 'calendar' | 'menu' | 'close';
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    compass: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5Z',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    note: 'M5 3h14v18H5ZM9 8h6M9 12h6M9 16h4',
    wallet: 'M20 7H4V4h14v3M4 7v13h16V7ZM16 12h5v4h-5Z',
    bag: 'M5 7h14v14H5ZM9 7V3h6v4M9 11v6M15 11v6',
    plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14m-5-5 5 5-5 5',
    pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    calendar: 'M4 5h16v16H4ZM8 3v4M16 3v4M4 10h16', menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
const photos = {
  barcelona: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1800&q=85',
  italy: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  coast: 'https://images.unsplash.com/photo-1612698093158-e07e6c901c48?auto=format&fit=crop&w=800&q=80',
};
function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <img className={className} src={src} alt={alt} loading={className === 'hero-photo' ? 'eager' : 'lazy'} onError={e => { e.currentTarget.style.display = 'none'; }} />;
}
const actions: { title: string; sub: string; icon: IconName }[] = [
  { title: 'Budget', sub: 'Make room for memories', icon: 'wallet' },
  { title: 'Saved Places', sub: 'Little places, big plans', icon: 'heart' },
  { title: 'Packing List', sub: 'Bring the essentials', icon: 'bag' },
  { title: 'Travel Notes', sub: 'Keep every little detail', icon: 'note' },
  { title: 'Create New Trip', sub: 'Where to next?', icon: 'plus' },
];
function Homepage() {
  const spainPhotos = useTripPhotos(spainTrip);
  const library = useJournalLibrary();
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const closeMenu = () => setMenuOpen(false);
  const toggleSave = (place: string) => setSaved(previous => previous.includes(place) ? previous.filter(p => p !== place) : [...previous, place]);
  return (
    <div className="app-shell">
      {menuOpen && <button className="menu-scrim" aria-label="Close navigation" onClick={closeMenu} />}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <a className="brand" href="#home" onClick={closeMenu}><span className="brand-mark"><Icon name="compass" size={31} /></span><span>My Travel<br />Journal<span className="brand-tagline">A little further, a little closer.</span></span></a>
        <button className="sidebar-close icon-button" aria-label="Close navigation" onClick={closeMenu}><Icon name="close" /></button>
        <p className="nav-caption">YOUR LITTLE WORLD</p>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#home" onClick={closeMenu}><Icon name="home" />Dashboard<span className="active-dot" /></a>
          <a className="nav-item" href="#trips" onClick={closeMenu}><Icon name="bag" />Your trips</a>
          <button className="nav-item" onClick={() => { closeMenu(); setDialog('Saved Places'); }}><Icon name="heart" />Saved places{saved.length > 0 && <span className="save-count">{saved.length}</span>}</button>
          <a className="nav-item" href="#inspiration" onClick={closeMenu}><Icon name="compass" />Inspiration</a>
          <button className="nav-item" onClick={() => { closeMenu(); setDialog('Travel Notes'); }}><Icon name="note" />Travel notes</button>
        </nav>
        <div className="sidebar-quote"><span>“</span><p>Some journeys take us<br />far from home.<br /><em>Some bring us closer.</em></p><div className="quote-rule" />YOUR NEXT CHAPTER AWAITS</div>
        <div className="profile"><span className="avatar">J</span><div>Your travel journal<small>A world of possibilities</small></div><span className="profile-spark">✧</span></div>
      </aside>
      <main id="home">
        <header className="page-header"><div><p className="eyebrow desktop-only">COLLECT MOMENTS, NOT THINGS</p><h1>Your next chapter awaits<span>.</span></h1><p className="header-subtitle">A place for your plans, your discoveries, and everything in between.</p></div><div className="header-right"><span className="date-label">LET’S GO SOMEWHERE</span><span className="avatar light">J</span></div><button className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon name="menu" /></button></header>
        <section className="hero" aria-label="Upcoming trip to Barcelona">
          <Photo src={photos.barcelona} alt="Sunlit Barcelona skyline and the Sagrada Família" className="hero-photo" />
          <div className="hero-shade" /><div className="hero-top"><span className="glass-pill"><span />THE NEXT ADVENTURE</span><span className="hero-coordinate">41.3874° N · 2.1686° E</span></div>
          <div className="hero-content"><p className="hero-kicker">A LITTLE SUNSHINE, A LITTLE SLOWER</p><h2>Hola, Barcelona.</h2><p>Winding streets. Long lunches. A city to get lost in.</p><button className="cream-button" onClick={() => { window.location.hash = tripHref(spainTrip.id); }}>Explore your trip <Icon name="arrow" size={18} /></button></div><span className="hero-location"><Icon name="pin" size={15} /> Barcelona, Spain</span>
        </section>
        <section className="upcoming-card" aria-label="Upcoming trip details"><div className="trip-calendar"><span>FEB</span><strong>15</strong></div><div className="upcoming-title"><span className="eyebrow">YOUR UPCOMING TRIP</span><h3>Spain 2027 <span className="status-pill">Planning</span></h3><p className="trip-timing"><span className="trip-date"><Icon name="calendar" size={14} />15–19 February 2027</span><span className="dot-separator" aria-hidden="true">·</span><span className="trip-duration">5 days of possibility</span></p></div><div className="trip-travelers"><span>J</span><p>One beautiful adventure<br /><small>Made just for you</small></p></div><button className="round-arrow" aria-label="View Spain 2027 trip" onClick={() => { window.location.hash = tripHref(spainTrip.id); }}><Icon name="arrow" /></button></section>
        <section className="quick-section" aria-labelledby="quick-title"><div className="section-heading quick-heading"><h2 id="quick-title">A little planning goes a long way</h2><span>THE DETAILS THAT MAKE IT YOURS</span></div><div className="quick-actions">{actions.map(action => <button key={action.title} className={`quick-card ${action.icon === 'plus' ? 'new-trip' : ''}`} onClick={() => action.title === 'Create New Trip' ? setCreatingTrip(true) : setDialog(action.title)}><span className={`action-icon icon-${action.icon}`}><Icon name={action.icon} /></span><strong>{action.title}</strong><small>{action.sub}</small></button>)}</div></section>
        <section id="trips" className="trips-section" aria-labelledby="trips-title"><div className="section-heading"><div><p className="eyebrow">EVERY JOURNEY HAS A STORY</p><h2 id="trips-title">Your trips</h2></div><span className="section-note">Your next memory starts here.</span></div><div className="trips-grid"><button className="trip-card" onClick={() => { window.location.hash = tripHref(spainTrip.id); }}><div className="trip-photo"><JournalPhoto photo={spainPhotos.photoFor('cover')} fallbackUrl={photos.barcelona} alt="Barcelona rooftops" showCredit={false} /><span className="photo-badge">UPCOMING</span><span className="photo-bottom">Spain</span></div><div className="trip-card-info"><div><h3>Spain 2027</h3><p>15–19 February 2027 <span>· 5 days</span></p></div><span className="small-arrow"><Icon name="arrow" size={19} /></span></div></button><button className="empty-trip" onClick={() => setCreatingTrip(true)}><span className="dashed-icon"><Icon name="plus" size={25} /></span><h3>A new adventure is calling</h3><p>Big dreams or a little weekend away.<br />Make a little space for your next escape.</p><span className="text-link">Plan a new trip <Icon name="arrow" size={16} /></span></button></div><PhotoCredit photo={spainPhotos.photoFor('cover')} /></section>
        {library.trips.length > 0 && <div className="pj-created-trips">{library.trips.map(trip => <LibraryTripCard key={trip.id} trip={trip} />)}</div>}
        <section id="inspiration" aria-labelledby="inspiration-title"><div className="section-heading"><div><p className="eyebrow">FOR YOUR EVER-GROWING WISHLIST</p><h2 id="inspiration-title">A little inspiration</h2></div><span className="section-note">Let your mind wander <span aria-hidden="true">↗</span></span></div><div className="inspiration-grid">{[{ name: 'The Italian Riviera', tag: 'SLOW DAYS & SALTY AIR', image: photos.italy, country: 'Italy' }, { name: 'A love letter to Paris', tag: 'CAFÉS, CULTURE & COBBLED STREETS', image: photos.paris, country: 'France' }, { name: 'Somewhere by the sea', tag: 'A LITTLE ESCAPE FROM THE EVERYDAY', image: photos.coast, country: 'Greece' }].map(place => <article className="inspiration-card" key={place.name}><div className="inspiration-photo"><Photo src={place.image} alt={`${place.country} travel inspiration`} /><span className="inspiration-country"><Icon name="pin" size={13} />{place.country}</span><button className={`save-button ${saved.includes(place.name) ? 'saved' : ''}`} aria-label={`${saved.includes(place.name) ? 'Unsave' : 'Save'} ${place.name}`} aria-pressed={saved.includes(place.name)} onClick={() => toggleSave(place.name)}><Icon name="heart" size={18} /></button></div><div className="inspiration-info"><p>{place.tag}</p><h3>{place.name}</h3></div></article>)}</div></section>
        <footer className="page-footer"><Icon name="compass" size={18} /><span>Go somewhere. Feel something. Keep the memory.</span><span>MY TRAVEL JOURNAL</span></footer>
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation"><a href="#home" className="selected"><Icon name="home" size={20} />Home</a><a href="#trips"><Icon name="bag" size={20} />My trips</a><button onClick={() => setCreatingTrip(true)} className="bottom-create" aria-label="Create new trip"><Icon name="plus" size={23} /></button><button onClick={() => setDialog('Saved Places')}><Icon name="heart" size={20} />Saved</button><a href="#inspiration"><Icon name="compass" size={20} />Explore</a></nav>
      {creatingTrip && <CreateTrip onClose={() => setCreatingTrip(false)} />}
      {dialog && <dialog open className="detail-dialog" ref={node => { if (node && !node.hasAttribute('data-modal')) { node.close(); node.showModal(); node.setAttribute('data-modal', 'true'); } }} onCancel={() => setDialog(null)} onClick={e => { if (e.target === e.currentTarget) setDialog(null); }}><button className="dialog-close icon-button" onClick={() => setDialog(null)} aria-label="Close dialog"><Icon name="close" /></button><p className="eyebrow">YOUR TRAVEL JOURNAL</p><h2>{dialog}</h2>{dialog === 'Spain 2027' ? <><p>Barcelona, Spain · 15–19 February 2027</p><p>Five days to explore, discover, and make memories.</p><span className="status-pill">Planning</span></> : dialog === 'Saved Places' ? <><p>Your inspiration collection for this visit.</p>{saved.length ? <ul>{saved.map(place => <li key={place}>{place}</li>)}</ul> : <p>Tap a heart on an inspiration card to save a destination here.</p>}</> : <p>This is a preview of your homepage. {dialog} will be available in a future update.</p>}<button className="green-button" onClick={() => setDialog(null)}>Back to your dashboard <Icon name="arrow" size={17} /></button></dialog>}
    </div>
  );
}
function App() {
  const library = useJournalLibrary();
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const route = tripRoute(hash);
  useEffect(() => {
    if (!tripRoute(hash)) {
      const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1) || 'home')?.scrollIntoView());
      return () => cancelAnimationFrame(frame);
    }
  }, [hash]);
  if (route) {
    const trip = route.tripId === spainTrip.id ? spainTrip : library.trips.find(trip => trip.id === route.tripId);
    if (trip) return <TripDashboard key={trip.id} trip={trip} section={route.section} />;
    return <div className="trip-dashboard"><main className="td-main"><a className="td-home-link" href="#home">← Back to homepage</a><section className="td-card"><h1>This trip is not in your journal.</h1><p className="td-muted">Check that you are using the same browser used to create this trip.</p><button className="td-button" onClick={() => { window.location.hash = 'home'; }}>Back to your journal</button></section></main></div>;
  }
  return <Homepage />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><JournalLibrary><App /></JournalLibrary></StrictMode>);
