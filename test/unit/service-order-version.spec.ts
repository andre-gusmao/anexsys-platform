import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatServiceOrderNo,
  nextVersionSuffix,
  withVersionSuffix,
} from 'src/modules/service-orders/application/service-order/service-order-version';

describe('service order versions', () => {
  it('formats the plate-style OS number and the linked letters', () => {
    assert.equal(formatServiceOrderNo(1), 'AAA000001');
    assert.equal(formatServiceOrderNo(2), 'AAA000002');
    assert.equal(formatServiceOrderNo(2, 'A'), 'AAA000002-A');
    assert.equal(formatServiceOrderNo(2, 'B'), 'AAA000002-B');
    assert.equal(formatServiceOrderNo(999999), 'AAA999999');
    assert.equal(formatServiceOrderNo(1000000), 'AAB000001');
  });

  it('keeps the original number when opening the next bag version', () => {
    assert.equal(withVersionSuffix('AAA000001', 'A'), 'AAA000001-A');
    assert.equal(withVersionSuffix('00002', 'A'), '00002-A');
  });

  it('opens the next free letter for the same OS group', () => {
    assert.equal(nextVersionSuffix([null]), 'A');
    assert.equal(nextVersionSuffix([null, 'A']), 'B');
    assert.equal(nextVersionSuffix([null, 'A', 'B']), 'C');
  });
});
