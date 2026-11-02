import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, emptyProgress, parseProgress, progressKey, spainTrip, tripHref, tripRoute, tripTiming } from '../src/trips/model.ts';

test('trip lasts five inclusive calendar days and four nights', () => {
  assert.equal(calendarDays(spainTrip), 5);
  assert.equal(spainTrip.nights, 4);
  assert.equal(spainTrip.destinations[2].kind, 'Excursion from Barcelona');
});
test('countdown uses Spain calendar dates, with departure day and completion boundaries', () => {
  assert.equal(tripTiming(spainTrip, new Date('2027-02-13T23:30:00Z')).value, '1 day');
  assert.equal(tripTiming(spainTrip, new Date('2027-02-14T23:00:00Z')).value, 'In progress');
  assert.match(tripTiming(spainTrip, new Date('2027-02-14T23:00:00Z')).detail, /Day 1 of 5/);
  assert.match(tripTiming(spainTrip, new Date('2027-02-19T22:59:59Z')).detail, /Day 5 of 5/);
  assert.equal(tripTiming(spainTrip, new Date('2027-02-19T23:00:00Z')).value, 'Completed');
});
test('empty or corrupt storage never invents a budget or completed tasks', () => {
  for (const raw of [null, '', '{broken', 'null', '42', '{"completed":"flights","budgetTarget":"100"}']) {
    assert.deepEqual(parseProgress(raw), emptyProgress());
  }
});
test('valid progress round-trips and invalid fields are discarded', () => {
  const progress = { completed: ['flights', 'transport'], budgetTarget: 1234.56 };
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
  assert.deepEqual(parseProgress('{"completed":["flights","flights","unknown"],"budgetTarget":-1}'), { completed: ['flights'], budgetTarget: null });
  assert.equal(parseProgress('{"budgetTarget":0}').budgetTarget, 0);
  assert.equal(parseProgress('{"budgetTarget":1e100}').budgetTarget, null);
});
test('trip routes and storage keys support separate trips', () => {
  assert.notEqual(progressKey('spain-2027'), progressKey('another-trip'));
  assert.deepEqual(tripRoute(tripHref(spainTrip.id, 'budget')), { tripId: 'spain-2027', section: 'budget' });
  assert.deepEqual(tripRoute('#/trips/spain-2027'), { tripId: 'spain-2027', section: 'overview' });
  assert.equal(tripRoute('#home'), null);
  assert.equal(tripRoute('#/trips/%not-valid'), null);
});
