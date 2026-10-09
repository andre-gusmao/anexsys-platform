import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describePublicOsError,
  toPublicOsPrintView,
} from '../../frontend/src/components/service-orders/public-os-view';

test('hides start:dev instructions from the public OS link', () => {
  assert.equal(
    describePublicOsError(
      new Error('O servidor não concluiu a operação. Pare o processo da porta 3000, rode npm run start:dev outra vez e tente de novo.'),
    ),
    'A ordem de serviço não pôde ser aberta agora. Tente de novo em instantes.',
  );
  assert.equal(describePublicOsError(new Error('Este link não foi encontrado.')), 'Este link não foi encontrado.');
});

test('maps the public OS payload onto the printed service order', () => {
  const printView = toPublicOsPrintView({
    orderNo: 'AAA000001',
    companyName: 'Ateliê A',
    customerFirstName: 'Sandra',
    customerName: 'Sandra Legramanti',
    status: 'in_production',
    statusLabel: 'Em produção',
    openedAt: '2026-10-03T10:00:00.000Z',
    promisedDeliveryDate: '2026-10-18',
    items: [{ itemNo: 1, itemType: 'Calça', description: 'Bainha', unitPrice: '90.00', subtotal: '90.00' }],
    totalValue: '90.00',
    recebiReady: false,
    pickedUp: false,
    paymentLabel: 'Pagar na retirada',
  });

  assert.equal(printView.orderNo, 'AAA000001');
  assert.equal(printView.customer.legalName, 'Sandra Legramanti');
  assert.equal(printView.statusLabel, 'Em produção');
  assert.equal(printView.items[0].unitPrice, '90.00');
});
