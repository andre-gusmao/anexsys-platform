"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useSession } from "@/components/providers/session-provider";
import {
  normalizeCompanyListRecords,
  normalizeCompanyRecord,
  resolveActiveCompanyId,
  type CompanyApiRecord,
  type CompanyRecord,
} from "@/components/admin/company-list-records";
import {
  MasterDataDuplicateGuard,
  normalizeCodeValue,
} from "@/components/ui/master-data-duplicate-guard";

type CompanyForm = {
  code: string;
  legalName: string;
  displayName: string;
  warrantyAdjustmentPeriodDays: string;
  warrantyExecutionPeriodDays: string;
  blockDeliveryWithOutstandingBalance: boolean;
};

const emptyForm = (): CompanyForm => ({
  code: "",
  legalName: "",
  displayName: "",
  warrantyAdjustmentPeriodDays: "7",
  warrantyExecutionPeriodDays: "7",
  blockDeliveryWithOutstandingBalance: false,
});

function mapCompanyToForm(company: CompanyRecord): CompanyForm {
  return {
    code: company.code,
    legalName: company.legalName,
    displayName: company.displayName,
    warrantyAdjustmentPeriodDays: String(company.warrantyAdjustmentPeriodDays ?? 7),
    warrantyExecutionPeriodDays: String(company.warrantyExecutionPeriodDays ?? 7),
    blockDeliveryWithOutstandingBalance: company.blockDeliveryWithOutstandingBalance,
  };
}

export function CompaniesWorkspace() {
  const { session, hasAnyPermission, apiJson } = useSession();
  const canRead = hasAnyPermission("tenants.read");
  const canWrite = hasAnyPermission("tenants.write");
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [companyDuplicateStatus, setCompanyDuplicateStatus] = useState<"idle" | "checking" | "duplicate">("idle");
  const [companyDuplicateMatch, setCompanyDuplicateMatch] = useState<CompanyRecord | null>(null);

  const filteredCompanies = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return companies;
    return companies.filter((company) =>
      [company.code, company.legalName, company.displayName].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [companies, searchQuery]);

  const activeCompany = useMemo(
    () => companies.find((company) => company.id === activeCompanyId) ?? null,
    [activeCompanyId, companies],
  );

  const loadCompanies = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiJson<CompanyApiRecord[]>("/tenants");
      const records = normalizeCompanyListRecords(response);
      const nextActiveCompanyId = resolveActiveCompanyId(records, activeCompanyId);
      const nextActiveCompany = records.find((company) => company.id === nextActiveCompanyId) ?? null;
      setCompanies(records);
      setActiveCompanyId(nextActiveCompanyId);
      if (!showCreateForm && nextActiveCompany) {
        setForm(mapCompanyToForm(nextActiveCompany));
      }
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "As empresas não puderam ser carregadas.");
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, apiJson, canRead, showCreateForm]);

  const clearCompanyDuplicate = useCallback(() => {
    setCompanyDuplicateStatus("idle");
    setCompanyDuplicateMatch(null);
  }, []);

  const handleSelectCompany = useCallback((company: CompanyRecord) => {
    setActiveCompanyId(company.id);
    setShowCreateForm(false);
    setForm(mapCompanyToForm(company));
    clearCompanyDuplicate();
  }, [clearCompanyDuplicate]);

  const handleCompanyCodeBlur = useCallback(() => {
    const normalizedCode = normalizeCodeValue(form.code);
    const currentCompanyId = showCreateForm ? null : activeCompany?.id ?? null;
    if (!normalizedCode) {
      clearCompanyDuplicate();
      return;
    }

    setCompanyDuplicateStatus("checking");
    const duplicate =
      companies.find((company) => normalizeCodeValue(company.code) === normalizedCode && company.id !== currentCompanyId) ?? null;
    setCompanyDuplicateMatch(duplicate);
    setCompanyDuplicateStatus(duplicate ? "duplicate" : "idle");
  }, [activeCompany?.id, clearCompanyDuplicate, companies, form.code, showCreateForm]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCompanies();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCompanies]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    if (companyDuplicateStatus !== "idle") {
      setMessage("Revise a duplicidade detectada antes de salvar a empresa.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const createdResponse = await apiJson<CompanyApiRecord>("/tenants", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          legalName: form.legalName,
          displayName: form.displayName,
          warrantyAdjustmentPeriodDays: Number(form.warrantyAdjustmentPeriodDays || 7),
          warrantyExecutionPeriodDays: Number(form.warrantyExecutionPeriodDays || 7),
          blockDeliveryWithOutstandingBalance: form.blockDeliveryWithOutstandingBalance,
        }),
      });
      const created = normalizeCompanyRecord(createdResponse, companies.length);
      setCompanies((current) => [created, ...current]);
      setActiveCompanyId(created.id);
      setShowCreateForm(false);
      setForm(mapCompanyToForm(created));
      setMessage("Empresa criada com sucesso. A edição detalhada permanece restrita ao contexto ativo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A empresa não pôde ser criada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || !activeCompany || activeCompany.id !== session?.tenantId) return;
    if (companyDuplicateStatus !== "idle") {
      setMessage("Revise a duplicidade detectada antes de salvar a empresa.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updatedResponse = await apiJson<CompanyApiRecord>(`/tenants/${activeCompany.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: form.code,
          legalName: form.legalName,
          displayName: form.displayName,
          warrantyAdjustmentPeriodDays: Number(form.warrantyAdjustmentPeriodDays || 7),
          warrantyExecutionPeriodDays: Number(form.warrantyExecutionPeriodDays || 7),
          blockDeliveryWithOutstandingBalance: form.blockDeliveryWithOutstandingBalance,
        }),
      });
      const updated = normalizeCompanyRecord(updatedResponse, 0);
      setCompanies((current) => current.map((company) => (company.id === updated.id ? updated : company)));
      setForm(mapCompanyToForm(updated));
      setMessage("Empresa atualizada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A empresa não pôde ser atualizada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(action: "activate" | "deactivate") {
    if (!canWrite || !activeCompany || activeCompany.id !== session?.tenantId) return;
    setSaving(true);
    setMessage(null);
    try {
      const updatedResponse = await apiJson<CompanyApiRecord>(`/tenants/${activeCompany.id}/${action}`, {
        method: "POST",
      });
      const updated = normalizeCompanyRecord(updatedResponse, 0);
      setCompanies((current) => current.map((company) => (company.id === updated.id ? updated : company)));
      setMessage(action === "activate" ? "Empresa reativada." : "Empresa desativada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O status da empresa não pôde ser alterado.");
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <section className="mini-card">
        <h3>Empresas indisponíveis</h3>
        <p>Você não possui acesso ao cadastro de empresas no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Administração</div>
        <h1 className="title">Empresas</h1>
        <p>Gerencie o contexto de empresa atual sem sair do fluxo administrativo.</p>
      </section>

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
              <p>{loading ? "Carregando…" : `${filteredCompanies.length} empresa(s) no contexto visível`}</p>
            </div>
            {canWrite ? (
              <button
                className="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setForm(emptyForm());
                  clearCompanyDuplicate();
                }}
                type="button"
              >
                Nova empresa
              </button>
            ) : null}
          </div>

          <div className="filters-grid">
            <label className="field">
              <span>Pesquisar</span>
              <input placeholder="Código ou nome" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </label>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th>Regras</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className={company.id === activeCompanyId ? "data-table__row--active" : undefined}
                    onClick={() => {
                      handleSelectCompany(company);
                    }}
                  >
                    <td>
                      <strong>{company.displayName}</strong>
                      <div className="table-subtle">
                        {company.code} · {company.legalName}
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip status-chip--${company.status}`}>{company.status}</span>
                    </td>
                    <td>
                      <div className="table-subtle">
                        Ajuste: {company.warrantyAdjustmentPeriodDays}d · Execução: {company.warrantyExecutionPeriodDays}d
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">Nenhuma empresa encontrada.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="mini-card">
          <div className="workspace-toolbar__copy">
            <h3>{showCreateForm ? "Criar empresa" : "Visualizar / editar"}</h3>
            <p>
              {showCreateForm
                ? "Cadastre uma nova empresa sem sair do workspace."
                : activeCompany
                  ? "O contexto ativo pode ser visualizado e ajustado nesta tela."
                  : "Selecione uma empresa na grade."}
            </p>
          </div>

          {showCreateForm ? (
            <form className="form-grid" onSubmit={handleCreate}>
              <CompanyFormFields
                duplicateGuard={
                  <MasterDataDuplicateGuard
                    entityLabel="empresa"
                    match={
                      companyDuplicateMatch
                        ? {
                            id: companyDuplicateMatch.id,
                            title: companyDuplicateMatch.displayName,
                            subtitle: `${companyDuplicateMatch.code} · ${companyDuplicateMatch.legalName}`,
                          }
                        : null
                    }
                    onCancel={() => {
                      setForm((current) => ({ ...current, code: "" }));
                      clearCompanyDuplicate();
                    }}
                    onEdit={companyDuplicateMatch ? () => handleSelectCompany(companyDuplicateMatch) : undefined}
                    onView={companyDuplicateMatch ? () => handleSelectCompany(companyDuplicateMatch) : undefined}
                    status={companyDuplicateStatus}
                  />
                }
                form={form}
                onCodeBlur={handleCompanyCodeBlur}
                onCodeChange={() => clearCompanyDuplicate()}
                setForm={setForm}
              />
              <div className="button-row">
                <button className="button" disabled={saving || companyDuplicateStatus !== "idle"} type="submit">
                  {saving ? "Salvando…" : "Salvar empresa"}
                </button>
                <button className="button-secondary" onClick={() => setShowCreateForm(false)} type="button">
                  Cancelar
                </button>
              </div>
            </form>
          ) : activeCompany ? (
            <div className="detail-stack">
              <div className="detail-grid">
                <div className="detail-field">
                  <span>Status</span>
                  <strong>{activeCompany.status}</strong>
                </div>
                <div className="detail-field">
                  <span>Código</span>
                  <strong>{activeCompany.code}</strong>
                </div>
                <div className="detail-field">
                  <span>Escopo atual</span>
                  <strong>{activeCompany.id === session?.tenantId ? "Empresa ativa" : "Nova empresa criada"}</strong>
                </div>
              </div>

              <form className="form-grid" onSubmit={handleUpdate}>
                <CompanyFormFields
                  duplicateGuard={
                    <MasterDataDuplicateGuard
                      entityLabel="empresa"
                      match={
                        companyDuplicateMatch
                          ? {
                              id: companyDuplicateMatch.id,
                              title: companyDuplicateMatch.displayName,
                              subtitle: `${companyDuplicateMatch.code} · ${companyDuplicateMatch.legalName}`,
                            }
                          : null
                      }
                      onCancel={() => {
                        setForm((current) => ({ ...current, code: activeCompany.code }));
                        clearCompanyDuplicate();
                      }}
                      onEdit={companyDuplicateMatch ? () => handleSelectCompany(companyDuplicateMatch) : undefined}
                      onView={companyDuplicateMatch ? () => handleSelectCompany(companyDuplicateMatch) : undefined}
                      status={companyDuplicateStatus}
                    />
                  }
                  form={form}
                  onCodeBlur={handleCompanyCodeBlur}
                  onCodeChange={() => clearCompanyDuplicate()}
                  setForm={setForm}
                />
                <div className="button-row">
                  <button
                    className="button"
                    disabled={saving || activeCompany.id !== session?.tenantId || !canWrite || companyDuplicateStatus !== "idle"}
                    type="submit"
                  >
                    {saving ? "Salvando…" : "Salvar alterações"}
                  </button>
                  <button
                    className="button-secondary"
                    disabled={saving || !canWrite || activeCompany.id !== session?.tenantId || activeCompany.status === "active"}
                    onClick={() => void handleStatus("activate")}
                    type="button"
                  >
                    Ativar
                  </button>
                  <button
                    className="button-secondary"
                    disabled={saving || !canWrite || activeCompany.id !== session?.tenantId || activeCompany.status === "inactive"}
                    onClick={() => void handleStatus("deactivate")}
                    type="button"
                  >
                    Desativar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="empty-state">Selecione uma empresa na grade para visualizar os detalhes.</div>
          )}
        </article>
      </section>
    </>
  );
}

function CompanyFormFields({
  duplicateGuard,
  form,
  onCodeBlur,
  onCodeChange,
  setForm,
}: {
  duplicateGuard?: ReactNode;
  form: CompanyForm;
  onCodeBlur?: () => void;
  onCodeChange?: () => void;
  setForm: Dispatch<SetStateAction<CompanyForm>>;
}) {
  return (
    <>
      <label className="field">
        <span>Código</span>
        <input
          required
          value={form.code}
          onBlur={onCodeBlur}
          onChange={(event) => {
            onCodeChange?.();
            setForm((current) => ({ ...current, code: event.target.value }));
          }}
        />
      </label>
      {duplicateGuard}
      <label className="field">
        <span>Razão social</span>
        <input required value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Prazo de ajuste em garantia (dias)</span>
        <input
          inputMode="numeric"
          value={form.warrantyAdjustmentPeriodDays}
          onChange={(event) => setForm((current) => ({ ...current, warrantyAdjustmentPeriodDays: event.target.value }))}
        />
      </label>
      <label className="field">
        <span>Prazo de execução em garantia (dias)</span>
        <input
          inputMode="numeric"
          value={form.warrantyExecutionPeriodDays}
          onChange={(event) => setForm((current) => ({ ...current, warrantyExecutionPeriodDays: event.target.value }))}
        />
      </label>
      <label className="field field--checkbox">
        <span>Bloquear entrega por inadimplência</span>
        <input
          checked={form.blockDeliveryWithOutstandingBalance}
          onChange={(event) => setForm((current) => ({ ...current, blockDeliveryWithOutstandingBalance: event.target.checked }))}
          type="checkbox"
        />
      </label>
    </>
  );
}
