# My Travel Journal

A minimal React, TypeScript, and Vite application.

Requires Node.js 20.19+ or 22.12+.

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
