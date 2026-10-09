export function normalizeClockTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
}

export function requireClockTime(value: string | null | undefined, fallback = '18:00'): string {
  return normalizeClockTime(value) ?? fallback;
}

export function currentClockTime(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
