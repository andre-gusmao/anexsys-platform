"use client";

import { useMemo, useState, type ReactNode } from "react";

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

export type SmartLookupOption = {
  id: string;
  label: string;
  hint?: string;
};

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
  onChange: (option: SmartLookupOption | null) => void;
  renderQuickCreate?: (props: QuickCreateRenderProps) => ReactNode;
};

const defaultCreateCopy: Record<SmartLookupEntity, string> = {
  customers: "Criar novo cliente",
  suppliers: "Criar novo fornecedor",
  companies: "Criar nova empresa",
  branches: "Criar nova filial",
  services: "Criar novo serviço",
  products: "Criar novo produto",
  employees: "Criar novo colaborador",
  "body-parts": "Criar nova parte do corpo",
  "measurement-units": "Criar nova unidade de medida",
};

export function SmartLookup({
  entityType,
  label,
  value,
  options,
  placeholder = "Pesquisar e selecionar",
  searchPlaceholder = "Digite para pesquisar",
  disabled,
  allowClear = true,
  canCreate = false,
  createLabel,
  emptyMessage = "Nenhum registro encontrado.",
  onChange,
  renderQuickCreate,
}: Props) {
  const [query, setQuery] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const selected = useMemo(() => options.find((option) => option.id === value) ?? null, [options, value]);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      [option.label, option.hint]
        .filter(Boolean)
        .some((candidate) => candidate?.toLowerCase().includes(normalized)),
    );
  }, [options, query]);

  return (
    <div className="smart-lookup">
      <div className="smart-lookup__label-row">
        <span>{label}</span>
        {selected ? <strong>{selected.label}</strong> : null}
      </div>

      <div className="smart-lookup__search-row">
        <input
          disabled={disabled}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (quickCreateOpen) {
              setQuickCreateOpen(false);
            }
          }}
        />
        {allowClear && selected ? (
          <button className="button-secondary" disabled={disabled} onClick={() => onChange(null)} type="button">
            Limpar
          </button>
        ) : null}
      </div>

      {selected ? <div className="smart-lookup__selected">Selecionado: {selected.label}</div> : null}

      <div className="smart-lookup__options">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const active = option.id === value;
            return (
              <button
                key={option.id}
                className={`smart-lookup__option${active ? " smart-lookup__option--active" : ""}`}
                disabled={disabled}
                onClick={() => onChange(option)}
                type="button"
              >
                <span>{option.label}</span>
                {option.hint ? <small>{option.hint}</small> : null}
              </button>
            );
          })
        ) : (
          <div className="empty-state">
            <p>{emptyMessage}</p>
            {canCreate && renderQuickCreate ? (
              <button className="button" disabled={disabled} onClick={() => setQuickCreateOpen(true)} type="button">
                + {createLabel ?? defaultCreateCopy[entityType]}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {quickCreateOpen && renderQuickCreate ? (
        <div className="smart-lookup__quick-create">
          {renderQuickCreate({
            initialValue: query.trim(),
            completeCreate: (option) => {
              onChange(option);
              setQuery("");
              setQuickCreateOpen(false);
            },
            cancelCreate: () => setQuickCreateOpen(false),
          })}
        </div>
      ) : null}

      {!selected && filteredOptions.length === 0 && !canCreate ? <div className="field__hint">{placeholder}</div> : null}
    </div>
  );
}
