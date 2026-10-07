import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activeCorrectiveVersion,
  currentReviewItemIds,
  currentRoundFinished,
  deriveReviewPhase,
  isReworkWaitingReturn,
  latestQualityRecordByItem,
  pieceReviewState,
} from '../../src/modules/quality/application/quality/quality-review';

test('keeps the latest quality record per piece', () => {
  const latest = latestQualityRecordByItem([
    { id: 'old', serviceOrderItemId: 'item-1', inspectionAt: '2026-10-01T10:00:00.000Z', releaseDecision: 'rejected' },
    { id: 'new', serviceOrderItemId: 'item-1', inspectionAt: '2026-10-07T10:00:00.000Z', releaseDecision: 'pending' },
    { id: 'other', serviceOrderItemId: 'item-2', inspectionAt: '2026-10-07T09:00:00.000Z', releaseDecision: 'approved' },
  ]);
  assert.equal(latest.get('item-1')?.id, 'new');
  assert.equal(latest.get('item-2')?.releaseDecision, 'approved');
});

test('scopes the current review to rejected pieces of the active OP version', () => {
  const version = {
    isActive: true,
    versionNo: 2,
    versionReason: 'rework',
    affectedServiceOrderItemIds: ['item-2'],
  };
  assert.deepEqual(currentReviewItemIds(['item-1', 'item-2', 'item-3'], version), ['item-2']);
  assert.equal(activeCorrectiveVersion([version])?.versionNo, 2);
});

test('marks rejected pieces as in rework until the bag returns', () => {
  const records = latestQualityRecordByItem([
    { id: 'r1', serviceOrderItemId: 'item-2', inspectionAt: '2026-10-07T10:00:00.000Z', releaseDecision: 'rejected' },
  ]);
  const version = { isActive: true, versionNo: 2, versionReason: 'rework', affectedServiceOrderItemIds: ['item-2'] };
  const waiting = isReworkWaitingReturn(version, records, ['item-2']);
  assert.equal(waiting, true);
  assert.deepEqual(pieceReviewState(records.get('item-2'), true, waiting), { decision: 'in_rework', canDecide: false });
  assert.equal(deriveReviewPhase({ allItemsApproved: false, reworkWaitingReturn: true }), 'rework_issued');
});

test('finishes a round only when every current piece is approved or rejected', () => {
  assert.equal(currentRoundFinished([{ decision: 'approved' }, { decision: 'pending' }]), false);
  assert.equal(currentRoundFinished([{ decision: 'approved' }, { decision: 'rejected' }]), true);
  assert.equal(deriveReviewPhase({ allItemsApproved: true, reworkWaitingReturn: true }), 'ready');
});
