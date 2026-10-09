import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatServiceOrderNo,
  isProcessSuffix,
  nextBagVersionSuffix,
  nextProcessSuffix,
  processLetterForReturnKind,
  withVersionSuffix,
} from 'src/modules/service-orders/application/service-order/service-order-version';

describe('service order versions', () => {
  it('formats the plate-style OS number and the numeric bag versions', () => {
    assert.equal(formatServiceOrderNo(1), 'AAA000001');
    assert.equal(formatServiceOrderNo(2), 'AAA000002');
    assert.equal(formatServiceOrderNo(2, '1'), 'AAA000002-1');
    assert.equal(formatServiceOrderNo(2, '2'), 'AAA000002-2');
    assert.equal(formatServiceOrderNo(999999), 'AAA999999');
    assert.equal(formatServiceOrderNo(1000000), 'AAB000001');
  });

  it('keeps the original number when opening the next bag version', () => {
    assert.equal(withVersionSuffix('AAA000001', '1'), 'AAA000001-1');
    assert.equal(withVersionSuffix('00002', '1'), '00002-1');
    assert.equal(withVersionSuffix('AAA000001-1', 'C'), 'AAA000001-C');
  });

  it('opens the next free number for the same OS group', () => {
    assert.equal(nextBagVersionSuffix([null]), '1');
    assert.equal(nextBagVersionSuffix([null, '1']), '2');
    assert.equal(nextBagVersionSuffix([null, '1', '2']), '3');
    assert.equal(nextBagVersionSuffix([null, 'A', 'B']), '3');
  });

  it('reserves letters for process children so G never clashes with a bag version', () => {
    assert.equal(nextProcessSuffix('C', [null, '1']), 'C');
    assert.equal(nextProcessSuffix('C', [null, 'C']), 'C2');
    assert.equal(nextProcessSuffix('G', ['1', 'R']), 'G');
    assert.equal(processLetterForReturnKind('reconserto'), 'R');
    assert.equal(processLetterForReturnKind('warranty'), 'G');
    assert.equal(processLetterForReturnKind('counter'), 'C');
    assert.equal(processLetterForReturnKind('charged'), null);
    assert.equal(isProcessSuffix('G'), true);
    assert.equal(isProcessSuffix('1'), false);
  });
});
