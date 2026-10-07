export const DEFAULT_MAX_PIECES_PER_BAG = 5;

const LETTERS = 26;
const DIGITS_PER_BLOCK = 999999;

export function formatServiceOrderNo(groupSeq: number, versionSuffix?: string | null): string {
  const base = formatServiceOrderPlate(groupSeq);
  return versionSuffix ? `${base}-${versionSuffix}` : base;
}

export function formatServiceOrderPlate(groupSeq: number): string {
  if (!Number.isInteger(groupSeq) || groupSeq < 1) {
    throw new Error('A sequência da OS precisa ser um número positivo.');
  }

  const index = groupSeq - 1;
  const letterIndex = Math.floor(index / DIGITS_PER_BLOCK);
  const letterSpace = LETTERS * LETTERS * LETTERS;
  if (letterIndex >= letterSpace) {
    throw new Error('A numeração da OS esgotou as combinações AAA000001 a ZZZ999999.');
  }

  const first = String.fromCharCode(65 + Math.floor(letterIndex / (LETTERS * LETTERS)));
  const second = String.fromCharCode(65 + Math.floor((letterIndex % (LETTERS * LETTERS)) / LETTERS));
  const third = String.fromCharCode(65 + (letterIndex % LETTERS));
  const digits = String((index % DIGITS_PER_BLOCK) + 1).padStart(6, '0');
  return `${first}${second}${third}${digits}`;
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
