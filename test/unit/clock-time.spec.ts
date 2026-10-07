import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeClockTime, requireClockTime } from 'src/modules/service-orders/application/delivery-date/clock-time';

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
});
