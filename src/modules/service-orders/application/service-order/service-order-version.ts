export const DEFAULT_MAX_PIECES_PER_BAG = 5;

export function formatServiceOrderNo(groupSeq: number, versionSuffix?: string | null): string {
  const base = String(groupSeq).padStart(5, '0');
  return versionSuffix ? `${base}-${versionSuffix}` : base;
}

export function nextVersionSuffix(existingSuffixes: Array<string | null | undefined>): string {
  const used = new Set(
    existingSuffixes
      .map((suffix) => suffix?.trim().toUpperCase())
      .filter((suffix): suffix is string => Boolean(suffix)),
  );

  for (let index = 0; index < 26; index += 1) {
    const letter = String.fromCharCode(65 + index);
    if (!used.has(letter)) {
      return letter;
    }
  }

  throw new Error('A OS já usou as versões de A até Z.');
}
