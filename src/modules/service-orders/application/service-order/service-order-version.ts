export const DEFAULT_MAX_PIECES_PER_BAG = 5;

const LETTERS = 26;
const DIGITS_PER_PAIR = 9999;

export function formatServiceOrderNo(groupSeq: number, versionSuffix?: string | null): string {
  const base = formatServiceOrderPlate(groupSeq);
  return versionSuffix ? `${base}-${versionSuffix}` : base;
}

export function formatServiceOrderPlate(groupSeq: number): string {
  if (!Number.isInteger(groupSeq) || groupSeq < 1) {
    throw new Error('A sequência da OS precisa ser um número positivo.');
  }

  const index = groupSeq - 1;
  const letterIndex = Math.floor(index / DIGITS_PER_PAIR);
  if (letterIndex >= LETTERS * LETTERS) {
    throw new Error('A numeração da OS esgotou as combinações AA0001 a ZZ9999.');
  }

  const first = String.fromCharCode(65 + Math.floor(letterIndex / LETTERS));
  const second = String.fromCharCode(65 + (letterIndex % LETTERS));
  const digits = String((index % DIGITS_PER_PAIR) + 1).padStart(4, '0');
  return `${first}${second}${digits}`;
}

export function withVersionSuffix(orderNo: string, versionSuffix: string): string {
  const base = orderNo.replace(/-[A-Z]$/i, '');
  return `${base}-${versionSuffix}`;
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
