import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { currentClockTime, normalizeClockTime, requireClockTime } from 'src/modules/service-orders/application/delivery-date/clock-time';

describe('normalizeClockTime', () => {
  it('keeps HH:MM and cuts seconds coming from Postgres time columns', () => {
    assert.equal(normalizeClockTime('18:00'), '18:00');
    assert.equal(normalizeClockTime('18:00:00'), '18:00');
    assert.equal(normalizeClockTime('09:30:00.000000'), '09:30');
    assert.equal(normalizeClockTime(null), null);
  });

  it('falls back when the clock value is missing', () => {
    assert.equal(requireClockTime('18:00:00'), '18:00');
    assert.equal(requireClockTime(null, '09:30'), '09:30');
  });

  it('reads HH:MM from a given instant', () => {
    assert.equal(currentClockTime(new Date('2026-10-07T15:04:00.000Z')), currentClockTime(new Date('2026-10-07T15:04:00.000Z')));
    assert.match(currentClockTime(new Date('2026-10-07T15:04:30')), /^\d{2}:\d{2}$/);
  });
});
