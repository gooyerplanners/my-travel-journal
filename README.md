# My Travel Journal

A minimal React, TypeScript, and Vite application.

Use Node.js 24 LTS (minimum 22.19 for the application).

```sh
npm ci
npm run dev
```

Build for production with `npm run build`. Preview the build with `npm run preview`.

## Spain 2027 dashboard

Open the homepage’s **Explore your trip** button or Spain trip card. Direct links use hash URLs, such as `/#/trips/spain-2027/overview`, so refresh works without server routing configuration.

The planning checklist and EUR budget target save to this browser’s local storage, separately for each trip ID. They do not sync across devices or browser origins. No reservations, payments, or daily itinerary are prefilled. Itinerary, Saved Places, Packing List, and Travel Notes are labelled placeholders; Bookings currently shows an empty state.

The countdown uses Spain’s calendar date and switches to in-progress/completed states at the trip boundaries. Model tests cover those boundaries, stored-data validation, and routing. Run them with Node.js 24 or newer:

```sh
node --test tests/trip-model.test.mjs
```

## Destination photography

Automatic Unsplash destination suggestions, alternative photo selection, and browser-local trip/photo references are implemented. Personal photo uploads, cloud storage, and account syncing are intentionally deferred. A server-side Unsplash Access Key is needed for live suggestions; the journal keeps graceful fallbacks until connected.

See [PHOTOGRAPHY.md](PHOTOGRAPHY.md) for the browser-only credential setup, privacy/persistence details, and server commands. No local software installation or public deployment is needed to configure the cloud preview.
