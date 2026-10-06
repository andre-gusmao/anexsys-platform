"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  filterLookupOptions,
  shouldShowCreateShortcut,
  type SmartLookupOption,
} from "@/components/ui/lookup-suggestions";

type Props = {
  value: string;
  options: SmartLookupOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  canCreate?: boolean;
  createLabel?: string;
  compact?: boolean;
  emptyMessage?: string;
  onChange: (value: string) => void;
  onSelect?: (option: SmartLookupOption) => void;
  onCreate?: (query: string) => void;
};

export function SearchAutocomplete({
  value,
  options,
  label,
  placeholder = "Digite para pesquisar",
  disabled,
  canCreate = false,
  createLabel = "Cadastrar",
  compact = false,
  emptyMessage = "Nenhum registro encontrado.",
  onChange,
  onSelect,
  onCreate,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const filteredOptions = useMemo(() => filterLookupOptions(options, value), [options, value]);
  const showCreate = shouldShowCreateShortcut(value, filteredOptions, canCreate && Boolean(onCreate));

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectOption = (option: SmartLookupOption) => {
    onChange(option.label);
    onSelect?.(option);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && filteredOptions[highlightedIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[highlightedIndex]);
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={`smart-lookup${compact ? " smart-lookup--compact" : ""}`} ref={rootRef}>
      {compact || !label ? null : (
        <div className="smart-lookup__label-row">
          <span>{label}</span>
        </div>
      )}
      <div className="smart-lookup__search-row">
        <input
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-label={label ?? placeholder}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (value.trim()) {
              setOpen(true);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          value={value}
        />
        {showCreate ? (
          <button
            className="button"
            disabled={disabled}
            onClick={() => {
              onCreate?.(value.trim());
              setOpen(false);
            }}
            type="button"
          >
            {createLabel}
          </button>
        ) : null}
      </div>
      {open && value.trim() ? (
        <div className="smart-lookup__dropdown" id={listId} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const active = index === highlightedIndex;
              return (
                <button
                  aria-selected={active}
                  className={`smart-lookup__option${active ? " smart-lookup__option--active" : ""}`}
                  disabled={disabled}
                  key={option.id}
                  onClick={() => selectOption(option)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.hint ? <small>{option.hint}</small> : null}
                </button>
              );
            })
          ) : (
            <div className="smart-lookup__empty">{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
