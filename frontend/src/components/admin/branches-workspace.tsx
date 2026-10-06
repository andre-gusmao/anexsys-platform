"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { empresaLabel } from "@/components/providers/session-context";
import { useSession } from "@/components/providers/session-provider";
import { SearchAutocomplete } from "@/components/ui/search-autocomplete";
import { SmartLookup, type SmartLookupOption } from "@/components/ui/smart-lookup";
import { DependencyGuardPanel, type DependencyValidationResult } from "@/components/ui/dependency-guard-panel";

type BranchRecord = {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  status: "active" | "inactive";
  parentBranchId: string | null;
  businessCalendarName: string | null;
  companyId?: string;
  timezone?: string;
  isDefault?: boolean;
};

type HoursDay = {
  weekday: number;
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  cutoffAt: string | null;
};

type BranchForm = {
  code: string;
  legalName: string;
  displayName: string;
  parentBranchId: string;
  businessCalendarName: string;
  companyId: string;
};

type ChildRecord = {
  id: string;
  displayName: string;
  code: string;
};

const emptyForm = (): BranchForm => ({
  code: "",
  legalName: "",
  displayName: "",
  parentBranchId: "",
  businessCalendarName: "",
  companyId: "",
});

function mapBranchToForm(branch: BranchRecord): BranchForm {
  return {
    code: branch.code,
    legalName: branch.legalName,
    displayName: branch.displayName,
    parentBranchId: branch.parentBranchId ?? "",
    businessCalendarName: branch.businessCalendarName ?? "",
    companyId: branch.companyId ?? "",
  };
}

export function BranchesWorkspace() {
  const { hasAnyPermission, apiJson, session, selectEmpresa } = useSession();
  const activeEmpresaId = session?.activeEmpresaId ?? null;
  const empresas = session?.empresas ?? [];
  const activeEmpresa = empresas.find((empresa) => empresa.id === activeEmpresaId) ?? null;
  const canRead = hasAnyPermission("branches.read");
  const canWrite = hasAnyPermission("branches.write");
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [searchQuery, setSearchQuery] = useWorkspaceScopedState("branches.searchQuery", "");
  const [statusFilter, setStatusFilter] = useWorkspaceScopedState("branches.statusFilter", "");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useWorkspaceScopedState<string | null>("branches.activeBranchId", null);
  const [showCreateForm, setShowCreateForm] = useWorkspaceScopedState("branches.showCreateForm", false);
  const [form, setForm] = useWorkspaceScopedState<BranchForm>("branches.form", emptyForm());
  const [dependencyValidation, setDependencyValidation] = useState<DependencyValidationResult | null>(null);
  const [hours, setHours] = useState<{ timezone: string; days: HoursDay[] } | null>(null);
  const [hoursSaving, setHoursSaving] = useState(false);

  const filteredBranches = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return branches.filter((branch) => {
      if (statusFilter && branch.status !== statusFilter) return false;
      if (!normalized) return true;
      return [branch.code, branch.legalName, branch.displayName, branch.businessCalendarName ?? ""].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [branches, searchQuery, statusFilter]);

  const branchLookupOptions = useMemo<SmartLookupOption[]>(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        label: branch.displayName,
        hint: `${branch.code} · ${branch.status}`,
      })),
    [branches],
  );

  const activeBranch = useMemo(() => branches.find((branch) => branch.id === activeBranchId) ?? null, [activeBranchId, branches]);
  useWorkspaceRegistration({
    label: activeBranch ? `Filial: ${activeBranch.displayName}` : "Filiais",
    subtitle: showCreateForm ? "Novo cadastro" : activeBranch?.code ?? null,
  });

  const loadHours = useCallback(async (branchId: string) => {
    try {
      const record = await apiJson<{ timezone: string; days: HoursDay[] }>(`/branches/${branchId}/operating-hours`);
      setHours({
        timezone: record.timezone,
        days: record.days.map((day) => ({
          ...day,
          opensAt: day.opensAt?.slice(0, 5) ?? null,
          closesAt: day.closesAt?.slice(0, 5) ?? null,
          cutoffAt: day.cutoffAt?.slice(0, 5) ?? null,
        })),
      });
    } catch {
      setHours(null);
    }
  }, [apiJson, setHours]);

  const loadChildren = useCallback(async (branchId: string) => {
    setDetailLoading(true);
    try {
      const records = await apiJson<ChildRecord[]>(`/branches/${branchId}/children`);
      setChildren(records);
    } catch {
      setChildren([]);
    } finally {
      setDetailLoading(false);
    }
  }, [apiJson]);

  const loadBranches = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const path = activeEmpresaId ? `/branches?companyId=${encodeURIComponent(activeEmpresaId)}` : "/branches";
      const records = await apiJson<BranchRecord[]>(path);
      const resolvedActiveBranch =
        records.find((branch) => branch.id === activeBranchId) ??
        records[0] ??
        null;
      setBranches(records);
      setActiveBranchId(resolvedActiveBranch?.id ?? null);
      if (!showCreateForm && resolvedActiveBranch) {
        setForm(mapBranchToForm(resolvedActiveBranch));
        void loadChildren(resolvedActiveBranch.id);
        void loadHours(resolvedActiveBranch.id);
      } else {
        setChildren([]);
      }
      setMessage(null);
      setDependencyValidation(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "As filiais não puderam ser carregadas.");
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, activeEmpresaId, apiJson, canRead, loadChildren, loadHours, setActiveBranchId, setBranches, setForm, setMessage, showCreateForm]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBranches();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadBranches]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setMessage(null);
    setDependencyValidation(null);
    try {
      const created = await apiJson<BranchRecord>("/branches", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          legalName: form.legalName,
          displayName: form.displayName,
          parentBranchId: form.parentBranchId || undefined,
          businessCalendarName: form.businessCalendarName || undefined,
          companyId: form.companyId || activeEmpresaId || undefined,
        }),
      });
      setBranches((current) => [...current, created].sort((left, right) => left.displayName.localeCompare(right.displayName)));
      setActiveBranchId(created.id);
      setForm(mapBranchToForm(created));
      setShowCreateForm(false);
      setMessage("Filial criada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A filial não pôde ser criada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || !activeBranch) return;
    setSaving(true);
    setMessage(null);
    setDependencyValidation(null);
    try {
      const updated = await apiJson<BranchRecord>(`/branches/${activeBranch.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: form.code,
          legalName: form.legalName,
          displayName: form.displayName,
          parentBranchId: form.parentBranchId || null,
          businessCalendarName: form.businessCalendarName || null,
          companyId: form.companyId || undefined,
        }),
      });
      setBranches((current) => current.map((branch) => (branch.id === updated.id ? updated : branch)));
      setForm(mapBranchToForm(updated));
      setMessage("Filial atualizada com sucesso.");
      void loadChildren(updated.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A filial não pôde ser atualizada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(action: "activate" | "deactivate") {
    if (!canWrite || !activeBranch) return;
    setSaving(true);
    setMessage(null);
    setDependencyValidation(null);
    try {
      if (action === "deactivate") {
        const validation = await apiJson<DependencyValidationResult>(`/branches/${activeBranch.id}/dependency-check?action=deactivate`);
        if (!validation.allowed) {
          setDependencyValidation(validation);
          setMessage(validation.message);
          return;
        }
      }
      const updated = await apiJson<BranchRecord>(`/branches/${activeBranch.id}/${action}`, { method: "POST" });
      setBranches((current) => current.map((branch) => (branch.id === updated.id ? updated : branch)));
      setMessage(action === "activate" ? "Filial ativada." : "Filial desativada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O status da filial não pôde ser alterado.");
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <section className="mini-card">
        <h3>Filiais indisponíveis</h3>
        <p>Você não possui acesso ao cadastro de filiais no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Administração</div>
        <h1 className="title">Filiais</h1>
        <p>
          A Filial pertence a uma Empresa. Clientes e medidas são da Conta e aparecem em todas as Empresas. Troque a
          Empresa no contexto ao lado para ver e cadastrar as filiais dela
          {activeEmpresa ? ` (${empresaLabel(activeEmpresa)})` : ""}.
        </p>
      </section>

      {dependencyValidation && !dependencyValidation.allowed ? <DependencyGuardPanel validation={dependencyValidation} /> : null}

      {message ? (
        <section className="mini-card">
          <p>{message}</p>
        </section>
      ) : null}

      <section className="workspace-split">
        <article className="mini-card">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar__copy">
              <h3>Grade operacional</h3>
              <p>{loading ? "Carregando…" : `${filteredBranches.length} filial(is) visível(is)`}</p>
            </div>
            {canWrite ? (
              <button
                className="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setForm({ ...emptyForm(), companyId: activeEmpresaId ?? "" });
                }}
                type="button"
              >
                Nova filial
              </button>
            ) : null}
          </div>

          <div className="filters-grid">
            <label className="field">
              <span>Pesquisar</span>
              <SearchAutocomplete
                canCreate={canWrite}
                onChange={setSearchQuery}
                onCreate={(name) => {
                  setShowCreateForm(true);
                  setForm({ ...emptyForm(), companyId: activeEmpresaId ?? "", displayName: name, legalName: name });
                }}
                options={branchLookupOptions}
                placeholder="Código, nome ou calendário"
                value={searchQuery}
              />
            </label>
            {empresas.length > 0 ? (
              <label className="field">
                <span>Empresa</span>
                <select
                  value={activeEmpresaId ?? ""}
                  onChange={(event) => {
                    if (event.target.value) {
                      void selectEmpresa(event.target.value);
                    }
                  }}
                >
                  {!activeEmpresaId ? <option value="">Selecione a Empresa</option> : null}
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresaLabel(empresa)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
            </label>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filial</th>
                  <th>Status</th>
                  <th>Calendário</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className={branch.id === activeBranchId ? "data-table__row--active" : undefined}
                    onClick={() => {
                      setActiveBranchId(branch.id);
                      setShowCreateForm(false);
                      setForm(mapBranchToForm(branch));
                      void loadChildren(branch.id);
                    }}
                  >
                    <td>
                      <strong>{branch.displayName}</strong>
                      <div className="table-subtle">
                        {branch.code} · {branch.legalName}
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip status-chip--${branch.status}`}>{branch.status}</span>
                    </td>
                    <td>{branch.businessCalendarName ?? "—"}</td>
                  </tr>
                ))}
                {!loading && filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">Nenhuma filial encontrada.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="mini-card">
          <div className="workspace-toolbar__copy">
            <h3>{showCreateForm ? "Criar filial" : "Visualizar / editar"}</h3>
            <p>{showCreateForm ? "Cadastre uma nova filial sem trocar de tela." : "Selecione uma filial para ver e editar os detalhes."}</p>
          </div>

          {showCreateForm ? (
            <form className="form-grid" onSubmit={handleCreate}>
              <BranchFormFields
                branches={branches}
                canCreate={canWrite}
                empresas={empresas}
                form={form}
                saving={saving}
                setBranches={setBranches}
                setForm={setForm}
                setMessage={setMessage}
              />
              <div className="button-row">
                <button className="button" disabled={saving} type="submit">
                  {saving ? "Salvando…" : "Salvar filial"}
                </button>
                <button className="button-secondary" onClick={() => setShowCreateForm(false)} type="button">
                  Cancelar
                </button>
              </div>
            </form>
          ) : activeBranch ? (
            <div className="detail-stack">
              <div className="detail-grid">
                <div className="detail-field">
                  <span>Status</span>
                  <strong>{activeBranch.status}</strong>
                </div>
                <div className="detail-field">
                  <span>Código</span>
                  <strong>{activeBranch.code}</strong>
                </div>
                <div className="detail-field">
                  <span>Filiais filhas</span>
                  <strong>{detailLoading ? "Carregando…" : children.length}</strong>
                </div>
              </div>

              <form className="form-grid" onSubmit={handleUpdate}>
                <BranchFormFields
                  branches={branches.filter((branch) => branch.id !== activeBranch.id)}
                  canCreate={canWrite}
                  empresas={empresas}
                  form={form}
                  saving={saving}
                  setBranches={setBranches}
                  setForm={setForm}
                  setMessage={setMessage}
                />
                <div className="button-row">
                  <button className="button" disabled={saving || !canWrite} type="submit">
                    {saving ? "Salvando…" : "Salvar alterações"}
                  </button>
                  <button
                    className="button-secondary"
                    disabled={saving || !canWrite || activeBranch.status === "active"}
                    onClick={() => void handleStatus("activate")}
                    type="button"
                  >
                    Ativar
                  </button>
                  <button
                    className="button-secondary"
                    disabled={saving || !canWrite || activeBranch.status === "inactive"}
                    onClick={() => void handleStatus("deactivate")}
                    type="button"
                  >
                    Desativar
                  </button>
                </div>
              </form>

              <BranchHoursEditor
                canWrite={canWrite}
                hours={hours}
                saving={hoursSaving}
                onChange={setHours}
                onSave={async () => {
                  if (!activeBranch || !hours) return;
                  setHoursSaving(true);
                  setMessage(null);
                  try {
                    const saved = await apiJson<{ timezone: string; days: HoursDay[] }>(`/branches/${activeBranch.id}/operating-hours`, {
                      method: "PUT",
                      body: JSON.stringify(hours),
                    });
                    setHours({
                      timezone: saved.timezone || hours.timezone,
                      days: saved.days.map((day) => ({
                        ...day,
                        opensAt: day.opensAt?.slice(0, 5) ?? null,
                        closesAt: day.closesAt?.slice(0, 5) ?? null,
                        cutoffAt: day.cutoffAt?.slice(0, 5) ?? null,
                      })),
                    });
                    setMessage("Horário e hora de corte da Filial atualizados.");
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "O horário não pôde ser salvo.");
                  } finally {
                    setHoursSaving(false);
                  }
                }}
              />

              <div className="mini-section">
                <h4>Subfiliais</h4>
                {children.length > 0 ? (
                  <div className="token-list">
                    {children.map((child) => (
                      <span className="token-pill" key={child.id}>
                        {child.displayName} · {child.code}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Nenhuma subfilial vinculada.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">Selecione uma filial na grade para visualizar os detalhes.</div>
          )}
        </article>
      </section>
    </>
  );
}

function BranchFormFields({
  branches,
  canCreate,
  empresas,
  form,
  saving,
  setBranches,
  setForm,
  setMessage,
}: {
  branches: BranchRecord[];
  canCreate: boolean;
  empresas: { id: string; legalName: string; tradeName: string | null; isDefault: boolean }[];
  form: BranchForm;
  saving: boolean;
  setBranches: Dispatch<SetStateAction<BranchRecord[]>>;
  setForm: Dispatch<SetStateAction<BranchForm>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
}) {
  const { apiJson } = useSession();
  const lookupOptions = useMemo<SmartLookupOption[]>(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        label: branch.displayName,
        hint: `${branch.code} · ${branch.status}`,
      })),
    [branches],
  );

  return (
    <>
      {empresas.length > 0 ? (
        <label className="field">
          <span>Empresa</span>
          <select
            required
            value={form.companyId}
            onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
          >
            <option value="">Selecione a Empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresaLabel(empresa)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="field">
        <span>Código</span>
        <input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
      </label>
      <label className="field">
        <span>Razão social</span>
        <input required value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Calendário operacional</span>
        <input value={form.businessCalendarName} onChange={(event) => setForm((current) => ({ ...current, businessCalendarName: event.target.value }))} />
      </label>
      <div className="field">
        <SmartLookup
          allowClear
          canCreate={canCreate}
          createLabel="Cadastrar"
          disabled={saving}
          entityType="branches"
          label="Filial pai"
          options={lookupOptions}
          value={form.parentBranchId}
          onChange={(option) => setForm((current) => ({ ...current, parentBranchId: option?.id ?? "" }))}
          renderQuickCreate={({ cancelCreate, completeCreate, initialValue }) => (
            <QuickCreateBranch
              initialValue={initialValue}
              onCancel={cancelCreate}
              onComplete={(created) => {
                setBranches((current) => [...current, created].sort((left, right) => left.displayName.localeCompare(right.displayName)));
                setMessage("Filial criada e selecionada automaticamente.");
                completeCreate({
                  id: created.id,
                  label: created.displayName,
                  hint: `${created.code} · ${created.status}`,
                });
              }}
            />
          )}
        />
      </div>
    </>
  );

  function QuickCreateBranch({
    initialValue,
    onCancel,
    onComplete,
  }: {
    initialValue: string;
    onCancel: () => void;
    onComplete: (created: BranchRecord) => void;
  }) {
    const [code, setCode] = useState(initialValue.slice(0, 12).toUpperCase());
    const [displayName, setDisplayName] = useState(initialValue);
    const [legalName, setLegalName] = useState(initialValue);
    const [pending, setPending] = useState(false);

    return (
      <div className="form-grid">
        <h4>Quick create</h4>
        <label className="field">
          <span>Código</span>
          <input required value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <label className="field">
          <span>Nome exibido</span>
          <input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label className="field">
          <span>Razão social</span>
          <input required value={legalName} onChange={(event) => setLegalName(event.target.value)} />
        </label>
        <div className="button-row">
          <button
            className="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                const created = await apiJson<BranchRecord>("/branches", {
                  method: "POST",
                  body: JSON.stringify({ code, displayName, legalName, companyId: form.companyId || undefined }),
                });
                onComplete(created);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "A filial não pôde ser criada.");
              } finally {
                setPending(false);
              }
            }}
            type="button"
          >
            {pending ? "Salvando…" : "Salvar e selecionar"}
          </button>
          <button className="button-secondary" onClick={onCancel} type="button">
            Cancelar
          </button>
        </div>
      </div>
    );
  }
}

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function BranchHoursEditor({
  hours,
  canWrite,
  saving,
  onChange,
  onSave,
}: {
  hours: { timezone: string; days: HoursDay[] } | null;
  canWrite: boolean;
  saving: boolean;
  onChange: (value: { timezone: string; days: HoursDay[] }) => void;
  onSave: () => void;
}) {
  if (!hours) {
    return (
      <div className="mini-section">
        <h4>Horário de funcionamento</h4>
        <p>Carregando horário…</p>
      </div>
    );
  }

  return (
    <div className="mini-section">
      <h4>Horário de funcionamento e hora de corte</h4>
      <p>Fuso: {hours.timezone}. A hora de corte é o fechamento, salvo se você alterar.</p>
      {hours.days
        .slice()
        .sort((left, right) => left.weekday - right.weekday)
        .map((day) => (
          <div className="filters-grid" key={day.weekday}>
            <label className="field">
              <span>{WEEKDAY_LABELS[day.weekday]}</span>
              <select
                disabled={!canWrite}
                value={day.isOpen ? "open" : "closed"}
                onChange={(event) => {
                  const isOpen = event.target.value === "open";
                  onChange({
                    ...hours,
                    days: hours.days.map((item) =>
                      item.weekday === day.weekday
                        ? {
                            ...item,
                            isOpen,
                            opensAt: isOpen ? item.opensAt ?? "09:30" : null,
                            closesAt: isOpen ? item.closesAt ?? "18:00" : null,
                            cutoffAt: isOpen ? item.cutoffAt ?? item.closesAt ?? "18:00" : null,
                          }
                        : item,
                    ),
                  });
                }}
              >
                <option value="open">Aberta</option>
                <option value="closed">Fechada</option>
              </select>
            </label>
            <label className="field">
              <span>Abre</span>
              <input
                disabled={!canWrite || !day.isOpen}
                type="time"
                value={day.opensAt ?? ""}
                onChange={(event) =>
                  onChange({
                    ...hours,
                    days: hours.days.map((item) =>
                      item.weekday === day.weekday ? { ...item, opensAt: event.target.value } : item,
                    ),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Fecha / corte</span>
              <input
                disabled={!canWrite || !day.isOpen}
                type="time"
                value={day.closesAt ?? ""}
                onChange={(event) =>
                  onChange({
                    ...hours,
                    days: hours.days.map((item) =>
                      item.weekday === day.weekday
                        ? { ...item, closesAt: event.target.value, cutoffAt: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
      {canWrite ? (
        <div className="button-row">
          <button className="button-secondary" disabled={saving} onClick={() => void onSave()} type="button">
            {saving ? "Salvando…" : "Salvar horário"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

