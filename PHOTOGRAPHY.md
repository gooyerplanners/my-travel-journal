# Destination photography

My Travel Journal uses the **Unsplash API**, not AI image generation. Unsplash supplies landscape photographs and photographer credits. Search and API credentials stay on the Node server. The browser only receives image references and attribution.

## Connect it entirely in your browser

1. Open [Unsplash applications](https://unsplash.com/oauth/applications), create/sign into your Unsplash account, and create an application for your travel journal. Copy its **Access Key**, not its Secret Key. Follow the Unsplash API guidelines and licence requirements.
2. In the Codex environment settings, enter the Access Key securely as the **UNSPLASH_ACCESS_KEY** secret. The secret requirement and API destination can be prepared by Codex; the value must be entered by you. Do not paste the key into chat, frontend source, or a public project file. Do not create a `VITE_UNSPLASH_ACCESS_KEY` variable.
   Remove the obsolete `PEXELS_API_KEY` requirement in environment settings; it is no longer used for searches. The configuration tool can add the Unsplash requirement but cannot remove the previous secret requirement.
3. Save the environment settings and publish the **private development environment configuration** if prompted, then reopen/restart its development preview so the Node server receives the new setting. This does **not** publish or deploy the website. Open **Change photographs → Check connection again**, or the new trip’s **Try loading photographs again** action.

No software needs to be installed on your computer. The cloud workspace runs the application server. If you use another browser-based workspace, it must provide a private server environment/secret setting and run the full Node/Vite application, not just host `dist`. If no secure secret setting is available, keep using fallbacks until a private server is available; never put the key in a shared editor file.

Server requests need HTTPS access to `api.unsplash.com`. Browser image loading needs access to `images.unsplash.com`; attribution links go to `unsplash.com`. The supplied server HTTP client respects inherited proxy settings and CA trust. TLS verification is kept enabled.

## What is implemented

- The approved homepage hero photograph, editorial copy, hero styles, and shortcut layouts are preserved. The Spain trip card keeps its existing photograph unless you intentionally choose a different overall trip cover in the photo picker.
- **Create New Trip** now opens a small form for a trip name, dates, timezone, and one or more destinations. Include a country to improve search relevance. The trip and each destination have independent photo slots.
- New trips automatically request high-resolution landscape suggestions for their overall cover and every destination. Suggestions save only when that slot has no existing selection, so later choices are not overwritten by a delayed search.
- **Change photographs** lets you choose the overall cover or one destination, search another phrase, browse result pages, and select an alternative. Existing Spain imagery stays unchanged unless you choose a replacement.
- Every API-sourced image retains its photographer and Unsplash referral links, including after a refresh. Image failure, offline, missing-key, no-results, request-limit, loading, and unavailable-provider states are handled without breaking the journal.
- The server uses fixed Unsplash endpoints, validates queries and provider URLs, caches metadata for 10 minutes, shares in-flight lookups, and limits requests. It does not expose arbitrary proxy URLs or return raw upstream errors. The Access Key is sent in a server-side `Client-ID` authorization header.
- Applying an automatic suggestion or choosing an alternative registers Unsplash’s required download-location event on the server. Browsing, rerendering, and refreshing a saved choice do not register new selections. Tracking failures leave the existing choice unchanged; they are not reported as successful saves. No image file is downloaded or uploaded by this tracking step.
- Hotlinked image URLs retain Unsplash tracking parameters such as `ixid`. Photographer and Unsplash links contain `utm_source=my_travel_journal&utm_medium=referral`.
- The API conservatively limits upstream requests to 40 per server process per hour to leave headroom within Unsplash’s initial demo quota. Normal requests are cached, but actual selection events are not. Other app instances share the provider’s overall quota; production access and current limits are managed in the Unsplash developer dashboard.

## Persistence and scope

Only trip data and **photo references** are saved in browser local storage, under separate trip IDs. Image files are hotlinked from Unsplash; they are not copied into the repository or stored as large data URLs. Clearing browser storage removes these selections. They do not sync across devices or browser origins. No cloud database, account system, personal photo storage, or upload endpoint is included. Previously saved Pexels references and their original attribution remain readable; no new Pexels API key is required.

Personal photographs belong to the future **Travel Notes** feature. Uploads and account syncing remain deferred. Itinerary, bookings entry, saved places, packing lists, and journal-entry editing remain placeholders from the previous phase.

Search is keyword-based, not a geocoding service: provider results may be imperfect. The user can refine a query with a country, region, or landmark and choose a better alternative. Unsplash availability, quotas, licensing, and API approval are governed by the provider. The app does not invent replacement photographs when the service is unavailable.

## Development and serving

Use Node.js 24 LTS (minimum 22.19 for the application; the tests use native TypeScript support).

- `npm ci` installs the locked dependencies in the cloud workspace.
- `npm run dev -- --host 0.0.0.0` runs Vite with the same-origin photography API on port 5173.
- `npm test` runs the trip model, photo API, query validation, attribution, and reference-persistence tests. Provider success responses in tests are controlled fixtures, not a substitute for a live Access Key check. Tests also cover attribution, preserved image parameters, selection tracking, rejected tracking URLs, and failed selections.
- `npm run build` checks TypeScript and creates the production frontend.
- `npm run preview` includes the same server API for previewing the build.
- `npm start` serves the already-built frontend and API together on loopback port 3000 (override `PORT`/`HOST` explicitly if needed). Starting this local server is not a public deployment.

The frontend alone cannot securely call the photography API. In a future deployment, run the Node API alongside it on the same origin and configure the secret server-side. Do not deploy publicly without approval.
