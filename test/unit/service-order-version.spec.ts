import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatServiceOrderNo, nextVersionSuffix } from 'src/modules/service-orders/application/service-order/service-order-version';

describe('service order versions', () => {
  it('formats the root OS and the linked letters', () => {
    assert.equal(formatServiceOrderNo(2), '00002');
    assert.equal(formatServiceOrderNo(2, 'A'), '00002-A');
    assert.equal(formatServiceOrderNo(2, 'B'), '00002-B');
  });

  it('opens the next free letter for the same OS group', () => {
    assert.equal(nextVersionSuffix([null]), 'A');
    assert.equal(nextVersionSuffix([null, 'A']), 'B');
    assert.equal(nextVersionSuffix([null, 'A', 'B']), 'C');
  });
});
