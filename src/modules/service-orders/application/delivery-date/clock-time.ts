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
