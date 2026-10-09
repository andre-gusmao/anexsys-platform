import assert from 'node:assert/strict';
import test from 'node:test';
import {
  publicCustomerFirstName,
  publicOsStatusLabel,
} from '../../src/modules/service-orders/application/service-order/service-order-public';

test('the public OS link hides internal quality names and prices stay out of the label', () => {
  assert.equal(publicOsStatusLabel('open'), 'Em aberto');
  assert.equal(publicOsStatusLabel('approved'), 'Em aberto');
  assert.equal(publicOsStatusLabel('in_production'), 'Em produção');
  assert.equal(publicOsStatusLabel('awaiting_proof'), 'Aguardando prova');
  assert.equal(publicOsStatusLabel('awaiting_quality'), 'Controle de qualidade');
  assert.equal(publicOsStatusLabel('quality'), 'Controle de qualidade');
  assert.equal(publicOsStatusLabel('in_rework'), 'Controle de qualidade');
  assert.equal(publicOsStatusLabel('ready_for_pickup'), 'Pronto para retirada');
  assert.equal(publicOsStatusLabel('picked_up'), 'Retirado');
  assert.equal(publicCustomerFirstName('Sandra Legramanti'), 'Sandra');
});
