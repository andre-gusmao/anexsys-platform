import assert from 'node:assert/strict';
import test from 'node:test';
import {
  osHasOutstandingBalance,
  osPaymentMethodLabel,
  osShowsFaltaPagamento,
} from '../../frontend/src/components/service-orders/os-payment';
import { pickupBlockedByOutstanding } from '../../src/modules/service-orders/application/service-order/service-order-pickup';

test('labels counter payment methods without calling a gateway', () => {
  assert.equal(osPaymentMethodLabel('cash'), 'Dinheiro');
  assert.equal(osPaymentMethodLabel('card'), 'Cartão na maquininha');
  assert.equal(osPaymentMethodLabel('pix'), 'Pix');
  assert.equal(osPaymentMethodLabel('bank_transfer'), 'Transferência');
  assert.equal(osPaymentMethodLabel('other'), 'Outro');
});

test('Falta pagamento is a warning for open balance, not a status', () => {
  assert.equal(osShowsFaltaPagamento({ outstandingBalance: '80.00', paymentStatus: 'pending' }), true);
  assert.equal(osShowsFaltaPagamento({ outstandingBalance: '20.00', paymentStatus: 'partial' }), true);
  assert.equal(osShowsFaltaPagamento({ outstandingBalance: '0.00', paymentStatus: 'paid' }), false);
  assert.equal(osHasOutstandingBalance({ outstandingBalance: '0.01' }), true);
});

test('delivery stays open unless the Conta blocks unpaid pickup', () => {
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: false, outstandingBalance: 80 }), false);
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: true, outstandingBalance: 0 }), false);
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: true, outstandingBalance: 10 }), true);
});
