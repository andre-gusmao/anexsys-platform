import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatServiceOrderNo,
  nextVersionSuffix,
  withVersionSuffix,
} from 'src/modules/service-orders/application/service-order/service-order-version';

describe('service order versions', () => {
  it('formats the plate-style OS number and the linked letters', () => {
    assert.equal(formatServiceOrderNo(1), 'AA0001');
    assert.equal(formatServiceOrderNo(2), 'AA0002');
    assert.equal(formatServiceOrderNo(2, 'A'), 'AA0002-A');
    assert.equal(formatServiceOrderNo(2, 'B'), 'AA0002-B');
    assert.equal(formatServiceOrderNo(9999), 'AA9999');
    assert.equal(formatServiceOrderNo(10000), 'AB0001');
  });

  it('keeps the original number when opening the next bag version', () => {
    assert.equal(withVersionSuffix('AA0001', 'A'), 'AA0001-A');
    assert.equal(withVersionSuffix('00002', 'A'), '00002-A');
  });

  it('opens the next free letter for the same OS group', () => {
    assert.equal(nextVersionSuffix([null]), 'A');
    assert.equal(nextVersionSuffix([null, 'A']), 'B');
    assert.equal(nextVersionSuffix([null, 'A', 'B']), 'C');
  });
});
