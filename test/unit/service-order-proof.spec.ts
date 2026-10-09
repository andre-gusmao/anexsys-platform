import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canActOnProof,
  canSendToProof,
  latestProofNoteByItem,
  normalizeProofNotes,
  PROOF_NOTE_MAX_CHARS,
  proofActionAudit,
  proofActionResultStatus,
} from '../../src/modules/service-orders/application/service-order/service-order-proof';
import {
  canActOnProof as canActOnProofUi,
  canSendToProof as canSendToProofUi,
  proofActionLabel,
  proofNotesReprintMessage,
} from '../../frontend/src/components/service-orders/os-proof';

test('prova stays on the same OS and returns to production after the fitting', () => {
  assert.equal(canSendToProof('in_production', true), true);
  assert.equal(canSendToProof('in_production', false), false);
  assert.equal(canSendToProof('awaiting_quality', true), false);
  assert.equal(canSendToProof('quality', true), false);
  assert.equal(canSendToProof('in_rework', true), false);
  assert.equal(canSendToProof('picked_up', true), false);
  assert.equal(canActOnProof('awaiting_proof'), true);
  assert.equal(canActOnProof('in_production'), false);
  assert.equal(proofActionResultStatus('send_to_proof'), 'awaiting_proof');
  assert.equal(proofActionResultStatus('complete_proof'), 'in_production');
  assert.equal(proofActionAudit('send_to_proof'), 'service_order.proof.send_to_proof');
  assert.equal(canSendToProofUi('in_production', true), true);
  assert.equal(canActOnProofUi('awaiting_proof'), true);
  assert.equal(proofActionLabel('send_to_proof'), 'Enviar para prova');
  assert.equal(proofActionLabel('complete_proof'), 'Prova feita');
  assert.match(proofNotesReprintMessage('AAA000001'), /reimpressa com as anotações de prova/);
});

test('proof notes stay piece-linked, trimmed and capped', () => {
  assert.deepEqual(
    normalizeProofNotes([
      { itemId: ' item-1 ', note: '  subir 1 cm  ' },
      { itemId: 'item-1', note: 'sobrepor' },
      { itemId: 'item-2', note: '   ' },
      { itemId: '', note: 'ignorar' },
      { itemId: 'item-3', note: 'x'.repeat(PROOF_NOTE_MAX_CHARS + 20) },
    ]),
    [
      { itemId: 'item-1', note: 'sobrepor' },
      { itemId: 'item-3', note: 'x'.repeat(PROOF_NOTE_MAX_CHARS) },
    ],
  );
  assert.deepEqual(normalizeProofNotes(null), []);

  const latest = latestProofNoteByItem([
    { serviceOrderItemId: 'item-1', createdAt: '2026-10-08T10:00:00.000Z', note: 'antiga' },
    { serviceOrderItemId: 'item-1', createdAt: '2026-10-08T12:00:00.000Z', note: 'nova' },
    { serviceOrderItemId: 'item-2', createdAt: '2026-10-08T11:00:00.000Z', note: 'saia' },
  ]);
  assert.equal(latest.get('item-1'), 'nova');
  assert.equal(latest.get('item-2'), 'saia');
});
