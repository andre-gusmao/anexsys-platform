import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOsWhatsAppMessage,
  buildProductionOrderPrintHtml,
  firstName,
  opShelfDateParts,
  toWhatsAppPhone,
} from '../../frontend/src/components/service-orders/os-documents';

test('builds the WhatsApp resend text without prices', () => {
  const message = buildOsWhatsAppMessage({
    customerName: 'Marina Andrade',
    companyName: 'Ateliê A',
    orderNo: 'OS-14555',
  });

  assert.equal(firstName('Marina Andrade'), 'Marina');
  assert.equal(toWhatsAppPhone('(11) 98888-7777'), '5511988887777');
  assert.match(message, /OS-14555/);
  assert.doesNotMatch(message, /R\$|valor|preço/i);
});

test('builds the A5 OP with the shelf face and without prices or quantity', () => {
  assert.deepEqual(opShelfDateParts('2026-10-18'), { day: '18', month: '10' });

  const html = buildProductionOrderPrintHtml(
    {
      productionNo: 'OP-1',
      serviceOrder: {
        orderNo: 'AAA000001',
        openedAt: '2026-10-03T10:00:00.000Z',
        promisedDeliveryDate: '2026-10-18',
      },
      customer: { legalName: 'Sandra Legramanti' },
      pieceDescription: null,
      instructions: null,
      items: [
        {
          itemType: 'Blusa',
          description: 'Conserto',
          complement: 'Preta — diminuir a alça',
          brand: 'Zara',
          model: 'Festa',
          serialNo: 'SN-22',
        },
      ],
      qrCode: { codeValue: 'AAA000001', reissueNo: 0 },
    },
    'Atelier de costura Iza Gusmão',
    'Pago na retirada',
  );

  assert.match(html, /Entrada/);
  assert.match(html, /AAA000001/);
  assert.match(html, /Blusa/);
  assert.match(html, /Conserto/);
  assert.match(html, /Zara · Festa · SN-22/);
  assert.match(html, /Pago na retirada/);
  assert.match(html, /class="op-shelf__day">18/);
  assert.match(html, /class="op-shelf__month">\/10/);
  assert.match(html, /op-shelf__os/);
  assert.doesNotMatch(html, /R\$|Qtd|quantidade|unitPrice|80,00/i);
  assert.doesNotMatch(html, /Previsão de Entrega[\s\S]*10\/10\/2026/i);

  const paidHtml = buildProductionOrderPrintHtml(
    {
      productionNo: 'OP-1',
      serviceOrder: { orderNo: 'AAA000001', promisedDeliveryDate: '2026-10-18' },
      customer: { legalName: 'Sandra Legramanti' },
      pieceDescription: null,
      instructions: null,
      items: [{ itemType: 'Blusa', description: 'Conserto' }],
      qrCode: null,
    },
    'Atelier',
    'Pago',
  );
  assert.match(paidHtml, />Pago</);
  assert.doesNotMatch(paidHtml, /Pago na retirada/);
});
