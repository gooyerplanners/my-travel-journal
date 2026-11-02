import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createPhotoApi } from '../server/photo-api.mjs';
import { normalizePexels } from '../server/photography.mjs';
import { createTrip, parseSavedTrips } from '../src/trips/createTrip.ts';
import { parsePhotoSelections, isDestinationPhoto } from '../src/photography/photoStorage.ts';
const rawPhoto = {
  id: 12345, width: 4000, height: 2400, alt: 'Sunlit Madrid rooftops',
  photographer: 'Example Photographer', photographer_url: 'https://www.pexels.com/@example',
  url: 'https://www.pexels.com/photo/madrid-12345/',
  src: { large2x: 'https://images.pexels.com/photos/12345/photo.jpeg?w=1920', medium: 'https://images.pexels.com/photos/12345/photo.jpeg?w=640' },
};
async function withApi(options, run) {
  const handler = createPhotoApi(options);
  const server = createServer((req, res) => { void handler(req, res, () => res.writeHead(404).end()); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
test('unconfigured service reports status and a useful error, without inventing images', async () => {
  await withApi({ env: {}, fetcher: () => { throw new Error('Should not fetch'); } }, async base => {
    assert.deepEqual(await (await fetch(base + '/api/journal/status')).json(), { searchConfigured: false });
    const response = await fetch(base + '/api/journal/photos/search?destination=Madrid');
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /PEXELS_API_KEY/);
  });
});
test('search keeps credentials server-side, returns attribution, filters portrait/small images, and caches', async () => {
  let calls = 0;
  await withApi({ env: { PEXELS_API_KEY: 'test-server-only-secret' }, fetcher: async (url, options) => {
    calls++; assert.equal(new URL(url).hostname, 'api.pexels.com');
    assert.equal(new URL(url).searchParams.get('query'), 'Kyoto, Japan');
    assert.equal(options.headers.Authorization, 'test-server-only-secret');
    return Response.json({ photos: [rawPhoto, { ...rawPhoto, id: 2, width: 400, height: 1000 }], next_page: 'provider-next-page' });
  } }, async base => {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(base + '/api/journal/photos/search?destination=Kyoto%2C%20Japan&page=1');
      assert.equal(response.status, 200);
      const text = await response.text(); assert.ok(!text.includes('test-server-only-secret'));
      const data = JSON.parse(text); assert.equal(data.photos.length, 1);
      assert.equal(data.photos[0].credit.name, 'Example Photographer');
      assert.equal(data.hasMore, true); assert.ok(isDestinationPhoto(data.photos[0]));
    }
    assert.equal(calls, 1);
  });
});
test('upstream failures and rate limits are useful and never leak secrets', async () => {
  for (const status of [401, 429, 500]) {
    await withApi({ env: { PEXELS_API_KEY: 'hidden-key' }, fetcher: async () => new Response('hidden-key upstream diagnostics', { status }) }, async base => {
      const response = await fetch(base + '/api/journal/photos/search?destination=Barcelona');
      assert.equal(response.status, status === 429 ? 429 : 503);
      assert.ok(!(await response.text()).includes('hidden-key'));
    });
  }
});
test('invalid queries, uploads, cross-site requests, and arbitrary image URLs are rejected', async () => {
  let fetched = false;
  await withApi({ env: { PEXELS_API_KEY: 'test' }, fetcher: () => { fetched = true; throw Error(); } }, async base => {
    for (const query of ['destination=', 'destination=Madrid&page=-1', 'destination=Madrid&page=1.5']) {
      assert.equal((await fetch(base + '/api/journal/photos/search?' + query)).status, 400);
    }
    assert.equal((await fetch(base + '/api/journal/photos/upload', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/api/journal/photos/search?destination=Madrid', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    assert.equal(fetched, false);
  });
  assert.throws(() => normalizePexels({ ...rawPhoto, src: { ...rawPhoto.src, large2x: 'https://attacker.example/photo.jpg' } }));
});
test('trip creation validates dates, supports multiple destinations, and restores after refresh', () => {
  const trip = createTrip({ name: 'Japan 2027', startDate: '2027-04-01', endDate: '2027-04-06', timeZone: 'Asia/Tokyo', destinations: ['Kyoto, Japan', 'Nara, Japan'] });
  assert.equal(trip.autoPhotography, true); assert.equal(trip.destinations.length, 2);
  assert.notEqual(trip.destinations[0].id, trip.destinations[1].id);
  assert.deepEqual(parseSavedTrips(JSON.stringify([trip])), [trip]);
  assert.deepEqual(parseSavedTrips('{broken'), []);
  for (const change of [{ endDate: '2027-03-01' }, { startDate: '2027-02-30' }, { timeZone: 'not-real' }, { destinations: ['Kyoto', 'Kyoto'] }]) {
    assert.throws(() => createTrip({ ...trip, destinations: ['Kyoto'], ...change }));
  }
});
test('photo references retain attribution across refresh and corrupt or unsafe data is ignored', () => {
  const photo = normalizePexels(rawPhoto);
  const records = [{ slot: 'cover', photo }, { slot: 'destination-0', photo }];
  assert.deepEqual(parsePhotoSelections(JSON.stringify(records)), records);
  assert.deepEqual(parsePhotoSelections('{broken'), []);
  assert.deepEqual(parsePhotoSelections(JSON.stringify([{ slot: 'cover', photo: { ...photo, url: 'javascript:alert(1)' } }])), []);
  assert.deepEqual(parsePhotoSelections(JSON.stringify([{ slot: 'cover', photo: { ...photo, source: 'upload' } }])), []);
});
