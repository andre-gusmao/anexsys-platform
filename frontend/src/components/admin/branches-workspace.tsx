"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useSession } from "@/components/providers/session-provider";
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
};

type BranchForm = {
  code: string;
  legalName: string;
  displayName: string;
  parentBranchId: string;
  businessCalendarName: string;
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
});

function mapBranchToForm(branch: BranchRecord): BranchForm {
  return {
    code: branch.code,
    legalName: branch.legalName,
    displayName: branch.displayName,
    parentBranchId: branch.parentBranchId ?? "",
    businessCalendarName: branch.businessCalendarName ?? "",
  };
}

export function BranchesWorkspace() {
  const { hasAnyPermission, apiJson } = useSession();
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

  const activeBranch = useMemo(() => branches.find((branch) => branch.id === activeBranchId) ?? null, [activeBranchId, branches]);
  useWorkspaceRegistration({
    label: activeBranch ? `Filial · ${activeBranch.displayName}` : "Filiais",
    subtitle: showCreateForm ? "Novo cadastro" : activeBranch?.code ?? null,
  });

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
      const records = await apiJson<BranchRecord[]>("/branches");
      setBranches(records);
      setActiveBranchId((current) => current ?? records[0]?.id ?? null);
      if (!showCreateForm && records[0]) {
        setForm(mapBranchToForm(records[0]));
        void loadChildren(records[0].id);
      }
      setMessage(null);
      setDependencyValidation(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "As filiais não puderam ser carregadas.");
    } finally {
      setLoading(false);
    }
  }, [apiJson, canRead, loadChildren, showCreateForm]);

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
        <p>Gerencie busca, criação, edição, visualização e hierarquia física das filiais do contexto ativo.</p>
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
                  setForm(emptyForm());
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
              <input placeholder="Código, nome ou calendário" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </label>
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
  form,
  saving,
  setBranches,
  setForm,
  setMessage,
}: {
  branches: BranchRecord[];
  canCreate: boolean;
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
          createLabel="Criar nova filial"
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
                  body: JSON.stringify({ code, displayName, legalName }),
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
