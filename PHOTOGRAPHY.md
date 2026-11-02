# Destination photography

My Travel Journal uses the **Pexels API**, not AI image generation. Pexels supplies landscape photographs and photographer credits. Search and API credentials stay on the Node server. The browser only receives image references and attribution.

## Connect it entirely in your browser

1. Open [Pexels API](https://www.pexels.com/api/), create/sign into your free Pexels account, and request an API key for your travel journal. Follow the current Pexels API terms and licence requirements.
2. In the Codex environment settings, enter that key securely as the **PEXELS_API_KEY** secret. The secret requirement and API destination can be prepared by Codex; the value must be entered by you. Do not paste the key into chat, frontend source, or a public project file. Do not create a `VITE_PEXELS_API_KEY` variable.
3. Save the environment settings and publish the **private development environment configuration** if prompted, then reopen/restart its development preview so the Node server receives the new setting. This does **not** publish or deploy the website. Open **Change photographs → Check connection again**, or the new trip’s **Try loading photographs again** action.

No software needs to be installed on your computer. The cloud workspace runs the application server. If you use another browser-based workspace, it must provide a private server environment/secret setting and run the full Node/Vite application, not just host `dist`. If no secure secret setting is available, keep using fallbacks until a private server is available; never put the key in a shared editor file.

Server requests need HTTPS access to `api.pexels.com`. Browser image loading needs access to `images.pexels.com`; attribution links go to `www.pexels.com`. The supplied server HTTP client respects inherited proxy settings and CA trust. TLS verification is kept enabled.

## What is implemented

- The approved homepage hero photograph, editorial copy, hero styles, and shortcut layouts are preserved. The Spain trip card keeps its existing photograph unless you intentionally choose a different overall trip cover in the photo picker.
- **Create New Trip** now opens a small form for a trip name, dates, timezone, and one or more destinations. Include a country to improve search relevance. The trip and each destination have independent photo slots.
- New trips automatically request high-resolution landscape suggestions for their overall cover and every destination. Suggestions save only when that slot has no existing selection, so later choices are not overwritten by a delayed search.
- **Change photographs** lets you choose the overall cover or one destination, search another phrase, browse result pages, and select an alternative. Existing Spain imagery stays unchanged unless you choose a replacement.
- Every API-sourced image retains its photographer and Pexels links, including after a refresh. Image failure, offline, missing-key, no-results, request-limit, loading, and unavailable-provider states are handled without breaking the journal.
- The server uses fixed Pexels endpoints, validates queries and provider URLs, caches requests for 10 minutes, shares in-flight lookups, and limits requests. It does not expose arbitrary proxy URLs or return raw upstream errors.

## Persistence and scope

Only trip data and **photo references** are saved in browser local storage, under separate trip IDs. Image files are loaded from Pexels; they are not copied into the repository or stored as large data URLs. Clearing browser storage removes these selections. They do not sync across devices or browser origins. No cloud database, account system, personal photo storage, or upload endpoint is included.

Personal photographs belong to the future **Travel Notes** feature. Uploads and account syncing remain deferred. Itinerary, bookings entry, saved places, packing lists, and journal-entry editing remain placeholders from the previous phase.

Search is keyword-based, not a geocoding service: provider results may be imperfect. The user can refine a query with a country, region, or landmark and choose a better alternative. Pexels availability, quotas, licensing, and API approval are governed by the provider. The app does not invent replacement photographs when the service is unavailable.

## Development and serving

Use Node.js 24 LTS (minimum 22.19 for the application; the tests use native TypeScript support).

- `npm ci` installs the locked dependencies in the cloud workspace.
- `npm run dev -- --host 0.0.0.0` runs Vite with the same-origin photography API on port 5173.
- `npm test` runs the trip model, photo API, query validation, attribution, and reference-persistence tests. Provider success responses in tests are controlled fixtures, not a substitute for a live API-key check.
- `npm run build` checks TypeScript and creates the production frontend.
- `npm run preview` includes the same server API for previewing the build.
- `npm start` serves the already-built frontend and API together on loopback port 3000 (override `PORT`/`HOST` explicitly if needed). Starting this local server is not a public deployment.

The frontend alone cannot securely call the photography API. In a future deployment, run the Node API alongside it on the same origin and configure the secret server-side. Do not deploy publicly without approval.
