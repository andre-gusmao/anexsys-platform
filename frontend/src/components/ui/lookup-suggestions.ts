export type SmartLookupOption = {
  id: string;
  label: string;
  hint?: string;
};

export const LOOKUP_SUGGESTION_LIMIT = 8;

export function filterLookupOptions(
  options: SmartLookupOption[],
  query: string,
  limit = LOOKUP_SUGGESTION_LIMIT,
): SmartLookupOption[] {
  const normalized = query.trim().toLowerCase();
  const matched = normalized
    ? options.filter((option) =>
        [option.label, option.hint].filter(Boolean).some((candidate) => candidate?.toLowerCase().includes(normalized)),
      )
    : options;
  return matched.slice(0, limit);
}

export function shouldShowCreateShortcut(query: string, filtered: SmartLookupOption[], canCreate: boolean): boolean {
  return canCreate && query.trim().length > 0 && filtered.length === 0;
}
