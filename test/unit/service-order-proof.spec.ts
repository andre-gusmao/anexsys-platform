import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canActOnProof,
  canSendToProof,
  proofActionAudit,
  proofActionResultStatus,
} from '../../src/modules/service-orders/application/service-order/service-order-proof';
import {
  canActOnProof as canActOnProofUi,
  canSendToProof as canSendToProofUi,
  proofActionLabel,
} from '../../frontend/src/components/service-orders/os-proof';

test('prova stays on the same OS and only starts from production with a closed bag', () => {
  assert.equal(canSendToProof('in_production', true), true);
  assert.equal(canSendToProof('in_production', false), false);
  assert.equal(canSendToProof('awaiting_quality', true), false);
  assert.equal(canSendToProof('quality', true), false);
  assert.equal(canSendToProof('in_rework', true), false);
  assert.equal(canSendToProof('picked_up', true), false);
  assert.equal(canActOnProof('awaiting_proof'), true);
  assert.equal(canActOnProof('in_production'), false);
  assert.equal(proofActionResultStatus('send_to_proof'), 'awaiting_proof');
  assert.equal(proofActionResultStatus('complete_proof'), 'awaiting_quality');
  assert.equal(proofActionResultStatus('resume_from_proof'), 'in_production');
  assert.equal(proofActionAudit('send_to_proof'), 'service_order.proof.send_to_proof');
  assert.equal(canSendToProofUi('in_production', true), true);
  assert.equal(canActOnProofUi('awaiting_proof'), true);
  assert.equal(proofActionLabel('send_to_proof'), 'Enviar para prova');
  assert.equal(proofActionLabel('complete_proof'), 'Prova feita');
  assert.equal(proofActionLabel('resume_from_proof'), 'Continuar produção');
});
