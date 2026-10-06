"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  filterLookupOptions,
  shouldShowCreateShortcut,
  type SmartLookupOption,
} from "@/components/ui/lookup-suggestions";

export type SmartLookupEntity =
  | "customers"
  | "suppliers"
  | "companies"
  | "branches"
  | "services"
  | "products"
  | "employees"
  | "body-parts"
  | "measurement-units";

export type { SmartLookupOption };

type QuickCreateRenderProps = {
  initialValue: string;
  completeCreate: (option: SmartLookupOption) => void;
  cancelCreate: () => void;
};

type Props = {
  entityType: SmartLookupEntity;
  label: string;
  value: string;
  options: SmartLookupOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  canCreate?: boolean;
  createLabel?: string;
  emptyMessage?: string;
  compact?: boolean;
  onChange: (option: SmartLookupOption | null) => void;
  onCreate?: (query: string) => void;
  onOpen?: () => void;
  renderQuickCreate?: (props: QuickCreateRenderProps) => ReactNode;
};

export function SmartLookup({
  entityType,
  label,
  value,
  options,
  placeholder = "Digite para pesquisar",
  searchPlaceholder,
  disabled,
  allowClear = true,
  canCreate = false,
  createLabel = "Cadastrar",
  emptyMessage = "Nenhum registro encontrado.",
  compact = false,
  onChange,
  onCreate,
  onOpen,
  renderQuickCreate,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const selected = useMemo(() => options.find((option) => option.id === value) ?? null, [options, value]);
  const filteredOptions = useMemo(() => filterLookupOptions(options, query), [options, query]);
  const showCreate = shouldShowCreateShortcut(query, filteredOptions, canCreate && Boolean(onCreate || renderQuickCreate));
  const displayValue = open || !selected ? query : selected.label;

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
    }
  }, [open, selected?.label]);

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
    onChange(option);
    setQuery(option.label);
    setOpen(false);
    setQuickCreateOpen(false);
  };

  const openCreate = () => {
    if (onCreate) {
      onCreate(query.trim());
      setOpen(false);
      return;
    }
    if (renderQuickCreate) {
      setQuickCreateOpen(true);
      setOpen(false);
    }
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
    if (event.key === "Enter") {
      if (open && filteredOptions[highlightedIndex]) {
        event.preventDefault();
        selectOption(filteredOptions[highlightedIndex]);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={`smart-lookup${compact ? " smart-lookup--compact" : ""}`} data-entity={entityType} ref={rootRef}>
      {compact ? null : (
        <div className="smart-lookup__label-row">
          <span>{label}</span>
        </div>
      )}

      <div className="smart-lookup__search-row">
        <div className="smart-lookup__box">
          <input
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            aria-label={label}
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              setHighlightedIndex(0);
              setQuickCreateOpen(false);
              if (selected && next.trim().toLowerCase() !== selected.label.toLowerCase()) {
                onChange(null);
              }
            }}
            onFocus={() => {
              setOpen(true);
              setQuery(selected?.label ?? query);
              onOpen?.();
            }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder ?? placeholder}
            role="combobox"
            value={displayValue}
          />
          {allowClear && selected ? (
            <button className="smart-lookup__clear" disabled={disabled} onClick={() => onChange(null)} type="button">
              Limpar
            </button>
          ) : null}
        </div>
      </div>

      {open && !quickCreateOpen ? (
        <div className="smart-lookup__dropdown" id={listId} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const active = option.id === value || index === highlightedIndex;
              return (
                <button
                  aria-selected={option.id === value}
                  className={`smart-lookup__option${active ? " smart-lookup__option--active" : ""}`}
                  disabled={disabled}
                  key={option.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.hint ? <small>{option.hint}</small> : null}
                </button>
              );
            })
          ) : (
            <div className="smart-lookup__empty">
              <p>{query.trim() ? emptyMessage : "Digite para ver sugestões."}</p>
              {showCreate ? (
                <button className="smart-lookup__create" disabled={disabled} onClick={openCreate} onMouseDown={(event) => event.preventDefault()} type="button">
                  {createLabel}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {quickCreateOpen && renderQuickCreate ? (
        <div className="smart-lookup__quick-create">
          {renderQuickCreate({
            initialValue: query.trim(),
            completeCreate: (option) => {
              selectOption(option);
            },
            cancelCreate: () => setQuickCreateOpen(false),
          })}
        </div>
      ) : null}
    </div>
  );
}
