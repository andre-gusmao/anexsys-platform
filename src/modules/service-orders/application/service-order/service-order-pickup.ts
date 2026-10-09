import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

export const PICKUP_WINDOW_MINUTES = 10;
export const PICKUP_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const PICKUP_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type PickupMethod = 'paper' | 'attendant' | 'link';

export function canStartPickup(status: string): boolean {
  return status === 'ready_for_pickup';
}

export function canCompletePickup(status: string): boolean {
  return status === 'ready_for_pickup';
}

export function pickupWindowExpiresAt(openedAt: Date, minutes = PICKUP_WINDOW_MINUTES): Date {
  return new Date(openedAt.getTime() + minutes * 60_000);
}

export function isPickupWindowOpen(
  openedAt?: Date | string | null,
  expiresAt?: Date | string | null,
  now = new Date(),
): boolean {
  if (!openedAt || !expiresAt) {
    return false;
  }
  const start = new Date(openedAt).getTime();
  const end = new Date(expiresAt).getTime();
  const current = now.getTime();
  return current >= start && current <= end;
}

export function canConfirmPickupFromLink(
  status: string,
  openedAt?: Date | string | null,
  expiresAt?: Date | string | null,
  now = new Date(),
): boolean {
  return canCompletePickup(status) && isPickupWindowOpen(openedAt, expiresAt, now);
}

export function pickupAcceptedText(orderNo: string): string {
  return `Confirmo que retirei a OS ${orderNo}.`;
}

export function pickupMethodLabel(method: string | null | undefined): string | null {
  if (method === 'paper') {
    return 'Papel';
  }
  if (method === 'attendant') {
    return 'Atendente';
  }
  if (method === 'link') {
    return 'Link do cliente';
  }
  return null;
}

export function normalizePickupPhoto(
  photo?: { mimeType?: string | null; contentBase64?: string | null; fileName?: string | null } | null,
): { mimeType: string; contentBase64: string; fileName: string } | null {
  const mimeType = photo?.mimeType?.trim().toLowerCase() ?? '';
  const contentBase64 = (photo?.contentBase64 ?? '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!contentBase64) {
    return null;
  }
  if (!PICKUP_PHOTO_MIME_TYPES.includes(mimeType as (typeof PICKUP_PHOTO_MIME_TYPES)[number])) {
    throw new DomainValidationError('A foto da retirada precisa ser JPEG, PNG ou WebP.');
  }
  const padding = contentBase64.endsWith('==') ? 2 : contentBase64.endsWith('=') ? 1 : 0;
  const bytes = Math.floor((contentBase64.length * 3) / 4) - padding;
  if (bytes > PICKUP_PHOTO_MAX_BYTES) {
    throw new DomainValidationError('A foto da retirada pode ter no máximo 4 MB.');
  }
  return {
    mimeType,
    contentBase64,
    fileName: photo?.fileName?.trim() || 'retirada.jpg',
  };
}
