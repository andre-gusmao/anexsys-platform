import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOsWhatsAppMessage,
  firstName,
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
