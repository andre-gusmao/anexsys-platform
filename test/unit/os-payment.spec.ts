import assert from 'node:assert/strict';
import test from 'node:test';
import {
  osCanOpenPay,
  osHasOutstandingBalance,
  osPaymentMethodLabel,
  osShowsFaltaPagamento,
} from '../../frontend/src/components/service-orders/os-payment';
import {
  osGroupPaymentFromMembers,
  osHasPendingProcessSibling,
  osListPaymentFromTotals,
  osPayLockedOnParent,
} from '../../src/modules/service-orders/application/service-order/service-order-finance';
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

test('disables Pagar after the OS is quitada', () => {
  assert.equal(osCanOpenPay({ status: 'open', paymentStatus: 'pending' }), true);
  assert.equal(osCanOpenPay({ status: 'open', paymentStatus: 'partial' }), true);
  assert.equal(osCanOpenPay({ status: 'open', paymentStatus: 'paid' }), false);
  assert.equal(osCanOpenPay({ status: 'cancelled', paymentStatus: 'pending' }), false);
  assert.equal(osCanOpenPay({ status: 'ready_for_pickup', paymentStatus: 'pending', payLockedOnParent: true }), false);
  assert.equal(osCanOpenPay({ status: 'open', paymentStatus: 'pending', payLockedOnParent: false }), true);
  assert.deepEqual(osListPaymentFromTotals('80.00', 0), {
    amountPaid: '0.00',
    outstandingBalance: '80.00',
    paymentStatus: 'pending',
  });
  assert.equal(osListPaymentFromTotals('80.00', 20).paymentStatus, 'partial');
  assert.equal(osListPaymentFromTotals('80.00', 80).paymentStatus, 'paid');
});

test('locks Pagar on the mother while a process child is open and pays the group together', () => {
  const members = [
    { id: 'so-1', totalValue: '80.00', versionSuffix: null, returnKind: null, status: 'ready_for_pickup' },
    { id: 'so-c', totalValue: '0.00', versionSuffix: 'C', returnKind: 'counter', status: 'open' },
  ];
  const paidById = new Map<string, number>([['so-c', 80]]);
  assert.equal(osHasPendingProcessSibling('so-1', members), true);
  assert.equal(osPayLockedOnParent({ isProcessRow: false, hasPendingProcessSibling: true }), true);
  assert.equal(osPayLockedOnParent({ isProcessRow: true, hasPendingProcessSibling: false }), false);
  assert.equal(osGroupPaymentFromMembers(members, paidById).paymentStatus, 'paid');
});

test('delivery stays open unless the Conta blocks unpaid pickup', () => {
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: false, outstandingBalance: 80 }), false);
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: true, outstandingBalance: 0 }), false);
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: true, outstandingBalance: 10 }), true);
});
