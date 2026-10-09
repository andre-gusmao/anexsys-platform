"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyEmpresaListFilters,
  buildEmpresaEmailCsv,
  buildEmpresaExcelCsv,
  buildPaginationItems,
  DEFAULT_EMPRESA_LIST_COLUMN_IDS,
  downloadTextFile,
  EMPRESA_LIST_COLUMNS,
  EMPRESA_LIST_PAGE_SIZES,
  emptyEmpresaListFilters,
  empresaDisplayName,
  empresaListStatusLabel,
  formatEmpresaCnpj,
  normalizeEmpresaListColumnIds,
  paginateEmpresaList,
  type EmpresaListColumnId,
  type EmpresaListFilters,
  type EmpresaListRecord,
} from "@/components/admin/empresa-list";
import { SearchAutocomplete } from "@/components/ui/search-autocomplete";
import type { SmartLookupOption } from "@/components/ui/lookup-suggestions";

const COLUMN_STORAGE_KEY = "anexsys.frontend.empresas.grid-columns.v1";

function FilterToggleIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
      <circle cx="10" cy="10" fill="none" r="6.25" stroke="currentColor" strokeWidth="2" />
      <path d="M14.8 14.8 L20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M7 10 H13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      {open ? null : <path d="M10 7 V13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />}
    </svg>
  );
}

function readStoredColumnIds(): EmpresaListColumnId[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_EMPRESA_LIST_COLUMN_IDS];
  }
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_EMPRESA_LIST_COLUMN_IDS];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? normalizeEmpresaListColumnIds(parsed.map(String)) : [...DEFAULT_EMPRESA_LIST_COLUMN_IDS];
  } catch {
    return [...DEFAULT_EMPRESA_LIST_COLUMN_IDS];
  }
}

type EmpresaListPanelProps = {
  empresas: EmpresaListRecord[];
  loading: boolean;
  canWrite: boolean;
  actingEmpresaId?: string | null;
  onCreate: (prefillName?: string) => void;
  onEdit: (empresa: EmpresaListRecord) => void;
  onDelete: (empresa: EmpresaListRecord) => void;
  onDeleteMany: (empresas: EmpresaListRecord[]) => void;
  onInactivate: (empresa: EmpresaListRecord) => void;
};

export function EmpresaListPanel({
  empresas,
  loading,
  canWrite,
  actingEmpresaId,
  onCreate,
  onEdit,
  onDelete,
  onDeleteMany,
  onInactivate,
}: Readonly<EmpresaListPanelProps>) {
  const [filters, setFilters] = useState<EmpresaListFilters>(emptyEmpresaListFilters);
  const [appliedFilters, setAppliedFilters] = useState<EmpresaListFilters>(emptyEmpresaListFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [openMenu, setOpenMenu] = useState<"actions" | "columns" | null>(null);
  const [visibleColumnIds, setVisibleColumnIds] = useState<EmpresaListColumnId[]>(readStoredColumnIds);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof EMPRESA_LIST_PAGE_SIZES)[number]>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const visibleColumns = useMemo(
    () => EMPRESA_LIST_COLUMNS.filter((column) => visibleColumnIds.includes(column.id)),
    [visibleColumnIds],
  );
  const filteredEmpresas = useMemo(() => applyEmpresaListFilters(empresas, appliedFilters), [appliedFilters, empresas]);
  const pagination = useMemo(() => paginateEmpresaList(filteredEmpresas, page, pageSize), [filteredEmpresas, page, pageSize]);
  const selectedEmpresas = useMemo(
    () => empresas.filter((empresa) => selectedIds.includes(empresa.id)),
    [empresas, selectedIds],
  );
  const nameLookupOptions = useMemo<SmartLookupOption[]>(
    () =>
      empresas.map((empresa) => ({
        id: empresa.id,
        label: empresaDisplayName(empresa),
        hint: formatEmpresaCnpj(empresa.cnpj) === "—" ? undefined : formatEmpresaCnpj(empresa.cnpj),
      })),
    [empresas],
  );
  const pageIds = pagination.items.map((empresa) => empresa.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const hasSelection = selectedEmpresas.length > 0;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnIds));
  }, [visibleColumnIds]);

  const applyFilters = (next: EmpresaListFilters) => {
    setAppliedFilters(next);
    setPage(1);
    setOpenMenu(null);
  };

  const toggleColumn = (columnId: EmpresaListColumnId, locked?: boolean) => {
    if (locked) {
      return;
    }
    setVisibleColumnIds((current) => {
      if (current.includes(columnId)) {
        return current.filter((id) => id !== columnId);
      }
      return [...current, columnId];
    });
  };

  const toggleSelected = (empresaId: string) => {
    setSelectedIds((current) =>
      current.includes(empresaId) ? current.filter((id) => id !== empresaId) : [...current, empresaId],
    );
  };

  const togglePageSelection = () => {
    setSelectedIds((current) => {
      if (allPageSelected) {
        return current.filter((id) => !pageIds.includes(id));
      }
      return [...new Set([...current, ...pageIds])];
    });
  };

  const renderCell = (empresa: EmpresaListRecord, columnId: EmpresaListColumnId) => {
    if (columnId === "name") {
      return (
        <>
          <strong>{empresaDisplayName(empresa)}</strong>
          <div className="table-subtle">{empresa.tradeName ? empresa.legalName : empresa.email ?? "—"}</div>
        </>
      );
    }
    if (columnId === "document") return formatEmpresaCnpj(empresa.cnpj);
    if (columnId === "city") return empresa.city ?? "—";
    if (columnId === "state") return empresa.state ?? "—";
    if (columnId === "email") return empresa.email ?? "—";
    if (columnId === "phone") return empresa.phone ?? "—";
    if (columnId === "status") {
      return <span className={`status-chip status-chip--${empresa.status}`}>{empresaListStatusLabel(empresa.status)}</span>;
    }
    return empresa.isDefault ? "Sim" : "Não";
  };

  return (
    <section className="mini-card cadastro-list">
      <h2 className="cadastro-list__title">Empresas</h2>

      <div className="cadastro-toolbar" ref={toolbarRef}>
        <div className="cadastro-toolbar__left">
          {canWrite ? (
            <button className="button" onClick={() => onCreate()} type="button">
              + Adicionar
            </button>
          ) : null}
          <div className="cadastro-menu">
            <button
              className="button-secondary"
              onClick={() => setOpenMenu((current) => (current === "actions" ? null : "actions"))}
              type="button"
            >
              Mais ações
            </button>
            {openMenu === "actions" ? (
              <ul className="cadastro-menu__list">
                <li>
                  <button
                    disabled={!hasSelection}
                    onClick={() => {
                      downloadTextFile(
                        "empresas.csv",
                        `\uFEFF${buildEmpresaExcelCsv(selectedEmpresas)}`,
                        "text/csv;charset=utf-8",
                      );
                      setOpenMenu(null);
                    }}
                    type="button"
                  >
                    Exportar para Excel
                  </button>
                </li>
                <li>
                  <button
                    disabled={!hasSelection}
                    onClick={() => {
                      downloadTextFile("empresas-emails.txt", buildEmpresaEmailCsv(selectedEmpresas), "text/plain;charset=utf-8");
                      setOpenMenu(null);
                    }}
                    type="button"
                  >
                    Exportar e-mails
                  </button>
                </li>
                {canWrite ? (
                  <li>
                    <button
                      disabled={!hasSelection}
                      onClick={() => {
                        onDeleteMany(selectedEmpresas);
                        setOpenMenu(null);
                      }}
                      type="button"
                    >
                      Excluir selecionados
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="cadastro-toolbar__right">
          <div className="cadastro-menu">
            <button
              aria-label="Gerenciar colunas"
              className="cadastro-icon-button"
              onClick={() => setOpenMenu((current) => (current === "columns" ? null : "columns"))}
              type="button"
            >
              <span aria-hidden="true">▦</span>
            </button>
            {openMenu === "columns" ? (
              <div className="cadastro-menu__list cadastro-menu__list--columns">
                <strong>Gerenciar colunas</strong>
                {EMPRESA_LIST_COLUMNS.map((column) => (
                  <label key={column.id}>
                    <input
                      checked={visibleColumnIds.includes(column.id)}
                      disabled={column.locked}
                      onChange={() => toggleColumn(column.id, column.locked)}
                      type="checkbox"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <form
            className="cadastro-search"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters(filters);
            }}
          >
            <SearchAutocomplete
              canCreate={canWrite}
              compact
              onChange={(name) => setFilters((current) => ({ ...current, name }))}
              onCreate={(name) => onCreate(name)}
              onSelect={(option) => {
                const next = { ...filters, name: option.label };
                setFilters(next);
                applyFilters(next);
              }}
              options={nameLookupOptions}
              placeholder="Buscar por nome"
              value={filters.name}
            />
            <button aria-label="Buscar" className="cadastro-icon-button cadastro-icon-button--accent" type="submit">
              ⌕
            </button>
          </form>
          <button
            aria-expanded={showFilters}
            aria-label={showFilters ? "Fechar filtros" : "Abrir filtros"}
            className={`cadastro-icon-button cadastro-filter-toggle${showFilters ? " cadastro-filter-toggle--open" : ""}`}
            onClick={() => setShowFilters((current) => !current)}
            title={showFilters ? "Fechar filtros" : "Abrir filtros"}
            type="button"
          >
            <FilterToggleIcon open={showFilters} />
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="cadastro-filter-panel">
          <div className="filters-grid">
            <label className="field">
              <span>Nome</span>
              <SearchAutocomplete
                canCreate={canWrite}
                onChange={(name) => setFilters((current) => ({ ...current, name }))}
                onCreate={(name) => onCreate(name)}
                options={nameLookupOptions}
                placeholder="Nome já cadastrado"
                value={filters.name}
              />
            </label>
            <label className="field">
              <span>CNPJ</span>
              <input
                onChange={(event) => setFilters((current) => ({ ...current, document: event.target.value }))}
                value={filters.document}
              />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
                value={filters.city}
              />
            </label>
            <label className="field">
              <span>UF</span>
              <input
                maxLength={2}
                onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value.toUpperCase() }))}
                value={filters.state}
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                onChange={(event) => setFilters((current) => ({ ...current, email: event.target.value }))}
                value={filters.email}
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                value={filters.status}
              >
                <option value="">Todos</option>
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
            </label>
          </div>
          <div className="button-row">
            <button className="button" onClick={() => applyFilters(filters)} type="button">
              Buscar
            </button>
            <button
              className="button-secondary"
              onClick={() => {
                const cleared = emptyEmpresaListFilters();
                setFilters(cleared);
                applyFilters(cleared);
              }}
              type="button"
            >
              Limpar
            </button>
          </div>
        </div>
      ) : null}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="data-table__check">
                <input
                  aria-label="Selecionar página"
                  checked={allPageSelected}
                  onChange={togglePageSelection}
                  type="checkbox"
                />
              </th>
              {visibleColumns.map((column) => (
                <th key={column.id}>{column.label}</th>
              ))}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((empresa) => {
              const busy = actingEmpresaId === empresa.id;
              return (
              <tr key={empresa.id}>
                <td className="data-table__check">
                  <input
                    aria-label={`Selecionar ${empresaDisplayName(empresa)}`}
                    checked={selectedIds.includes(empresa.id)}
                    onChange={() => toggleSelected(empresa.id)}
                    type="checkbox"
                  />
                </td>
                {visibleColumns.map((column) => (
                  <td key={column.id}>{renderCell(empresa, column.id)}</td>
                ))}
                <td>
                  {canWrite ? (
                    <div className="table-actions">
                      <button className="button-secondary" disabled={busy} onClick={() => onEdit(empresa)} type="button">
                        Alterar
                      </button>
                      <button className="button-secondary" disabled={busy} onClick={() => onDelete(empresa)} type="button">
                        Excluir
                      </button>
                      <button
                        className="button-secondary"
                        disabled={busy || empresa.status === "inactive"}
                        onClick={() => onInactivate(empresa)}
                        type="button"
                      >
                        Inativar
                      </button>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
              );
            })}
            {!loading && pagination.totalItems === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2}>
                  <div className="empty-state">Nenhuma empresa encontrada para os filtros informados.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="cadastro-pagination">
        <p className="cadastro-pagination__summary">
          {loading
            ? "Carregando…"
            : pagination.totalItems === 0
              ? "Nenhum registro"
              : `Registros ${pagination.start}–${pagination.end} de ${pagination.totalItems} no total`}
        </p>
        <div className="cadastro-pagination__controls">
          <label>
            <span>Por página</span>
            <select
              onChange={(event) => {
                setPageSize(Number(event.target.value) as (typeof EMPRESA_LIST_PAGE_SIZES)[number]);
                setPage(1);
              }}
              value={pageSize}
            >
              {EMPRESA_LIST_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="cadastro-pagination__nav">
            <button
              aria-label="Página anterior"
              className="cadastro-page"
              disabled={pagination.currentPage <= 1}
              onClick={() => setPage(pagination.currentPage - 1)}
              type="button"
            >
              ‹
            </button>
            {buildPaginationItems(pagination.currentPage, pagination.totalPages).map((item, index) =>
              item === "ellipsis" ? (
                <span className="cadastro-page cadastro-page--ellipsis" key={`ellipsis-${index}`}>
                  …
                </span>
              ) : (
                <button
                  aria-current={item === pagination.currentPage ? "page" : undefined}
                  className={`cadastro-page${item === pagination.currentPage ? " cadastro-page--active" : ""}`}
                  key={item}
                  onClick={() => setPage(item)}
                  type="button"
                >
                  {item}
                </button>
              ),
            )}
            <button
              aria-label="Próxima página"
              className="cadastro-page"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => setPage(pagination.currentPage + 1)}
              type="button"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
