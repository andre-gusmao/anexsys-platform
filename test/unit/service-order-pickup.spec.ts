import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canCompletePickup,
  canConfirmPickupFromLink,
  canStartPickup,
  isPickupWindowOpen,
  normalizePickupPhoto,
  pickupAcceptedText,
  pickupBlockedByOutstanding,
  pickupMethodLabel,
  pickupWindowExpiresAt,
  PICKUP_WINDOW_MINUTES,
} from '../../src/modules/service-orders/application/service-order/service-order-pickup';
import { pickupMethodLabel as pickupMethodLabelUi } from '../../frontend/src/components/service-orders/os-pickup';
import { DomainValidationError } from '../../src/shared/errors/domain-validation.error';

test('pickup window enables Recebi only after the attendant starts it', () => {
  assert.equal(canStartPickup('ready_for_pickup'), true);
  assert.equal(canStartPickup('in_production'), false);
  assert.equal(canCompletePickup('ready_for_pickup'), true);
  assert.equal(PICKUP_WINDOW_MINUTES, 10);

  const openedAt = new Date('2026-10-09T12:00:00.000Z');
  const expiresAt = pickupWindowExpiresAt(openedAt);
  assert.equal(expiresAt.getTime(), openedAt.getTime() + 10 * 60_000);
  assert.equal(isPickupWindowOpen(openedAt, expiresAt, new Date('2026-10-09T12:05:00.000Z')), true);
  assert.equal(isPickupWindowOpen(openedAt, expiresAt, new Date('2026-10-09T12:11:00.000Z')), false);
  assert.equal(canConfirmPickupFromLink('ready_for_pickup', openedAt, expiresAt, new Date('2026-10-09T12:05:00.000Z')), true);
  assert.equal(canConfirmPickupFromLink('ready_for_pickup', openedAt, expiresAt, new Date('2026-10-09T12:11:00.000Z')), false);
  assert.equal(canConfirmPickupFromLink('in_production', openedAt, expiresAt, new Date('2026-10-09T12:05:00.000Z')), false);
  assert.equal(pickupAcceptedText('AAA000001'), 'Confirmo que retirei a OS AAA000001.');
  assert.equal(pickupMethodLabel('paper'), 'Papel');
  assert.equal(pickupMethodLabel('attendant'), 'Atendente');
  assert.equal(pickupMethodLabel('link'), 'Link do cliente');
  assert.equal(pickupMethodLabelUi('link'), 'Link do cliente');
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: true, outstandingBalance: 12 }), true);
  assert.equal(pickupBlockedByOutstanding({ blockDeliveryWithOutstandingBalance: false, outstandingBalance: 12 }), false);
});

test('pickup photo stays optional for the attendant and required for paper', () => {
  assert.equal(normalizePickupPhoto(null), null);
  assert.equal(normalizePickupPhoto({ mimeType: 'image/jpeg', contentBase64: '  ' }), null);
  const photo = normalizePickupPhoto({
    mimeType: 'image/jpeg',
    contentBase64: 'data:image/jpeg;base64,AAAA',
    fileName: 'op.jpg',
  });
  assert.equal(photo?.mimeType, 'image/jpeg');
  assert.equal(photo?.contentBase64, 'AAAA');
  assert.throws(
    () => normalizePickupPhoto({ mimeType: 'application/pdf', contentBase64: 'AAAA' }),
    (error: unknown) => error instanceof DomainValidationError,
  );
});
