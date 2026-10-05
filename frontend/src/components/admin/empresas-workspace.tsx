"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useSession } from "@/components/providers/session-provider";

type CompanyRecord = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string | null;
  isDefault: boolean;
};

type CompanyForm = {
  legalName: string;
  tradeName: string;
  cnpj: string;
};

const emptyForm = (): CompanyForm => ({ legalName: "", tradeName: "", cnpj: "" });

export function EmpresasWorkspace() {
  const { hasAnyPermission, apiJson } = useSession();
  const canRead = hasAnyPermission("companies.read");
  const canWrite = hasAnyPermission("companies.write");
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeId, setActiveId] = useWorkspaceScopedState<string | null>("empresas.activeId", null);
  const [showCreate, setShowCreate] = useWorkspaceScopedState("empresas.showCreate", false);
  const [form, setForm] = useWorkspaceScopedState<CompanyForm>("empresas.form", emptyForm());

  const active = useMemo(() => companies.find((company) => company.id === activeId) ?? null, [activeId, companies]);
  useWorkspaceRegistration({
    label: active ? `Empresa: ${active.tradeName || active.legalName}` : "Empresas",
    subtitle: showCreate ? "Novo cadastro" : active?.cnpj ?? null,
  });

  const loadCompanies = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const records = await apiJson<CompanyRecord[]>("/companies");
      setCompanies(records);
      const nextId = records.some((company) => company.id === activeId) ? activeId : records[0]?.id ?? null;
      setActiveId(nextId);
      const next = records.find((company) => company.id === nextId) ?? null;
      if (next && !showCreate) {
        setForm({ legalName: next.legalName, tradeName: next.tradeName ?? "", cnpj: next.cnpj ?? "" });
      }
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "As empresas não puderam ser carregadas.");
    } finally {
      setLoading(false);
    }
  }, [activeId, apiJson, canRead, setActiveId, setForm, showCreate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCompanies();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCompanies]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<CompanyRecord>("/companies", {
        method: "POST",
        body: JSON.stringify({
          legalName: form.legalName,
          tradeName: form.tradeName || undefined,
          cnpj: form.cnpj || undefined,
        }),
      });
      setCompanies((current) => [...current, created]);
      setActiveId(created.id);
      setShowCreate(false);
      setForm({ legalName: created.legalName, tradeName: created.tradeName ?? "", cnpj: created.cnpj ?? "" });
      setMessage("Empresa criada. A Filial padrão (Matriz) nasceu junto, com horário de funcionamento.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A empresa não pôde ser criada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || !active) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiJson<CompanyRecord>(`/companies/${active.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          legalName: form.legalName,
          tradeName: form.tradeName || null,
          cnpj: form.cnpj || null,
        }),
      });
      setCompanies((current) => current.map((company) => (company.id === updated.id ? updated : company)));
      setMessage("Empresa atualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A empresa não pôde ser atualizada.");
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
        <p>A Empresa é o CNPJ dentro da Conta. Se não houver Filial física, o sistema cria a Filial padrão (Matriz).</p>
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
              <h3>Empresas da Conta</h3>
              <p>{loading ? "Carregando…" : `${companies.length} empresa(s)`}</p>
            </div>
            {canWrite ? (
              <button
                className="button"
                onClick={() => {
                  setShowCreate(true);
                  setForm(emptyForm());
                }}
                type="button"
              >
                Nova empresa
              </button>
            ) : null}
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>CNPJ</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    className={company.id === activeId && !showCreate ? "is-selected" : undefined}
                    key={company.id}
                    onClick={() => {
                      setActiveId(company.id);
                      setShowCreate(false);
                      setForm({
                        legalName: company.legalName,
                        tradeName: company.tradeName ?? "",
                        cnpj: company.cnpj ?? "",
                      });
                    }}
                  >
                    <td>
                      {company.tradeName || company.legalName}
                      {company.isDefault ? " · padrão" : ""}
                    </td>
                    <td>{company.cnpj || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="mini-card">
          {showCreate ? (
            <form className="form-grid" onSubmit={handleCreate}>
              <h3>Nova empresa</h3>
              <CompanyFields form={form} setForm={setForm} />
              <div className="button-row">
                <button className="button" disabled={saving} type="submit">
                  {saving ? "Salvando…" : "Criar empresa"}
                </button>
                <button className="button-secondary" onClick={() => setShowCreate(false)} type="button">
                  Cancelar
                </button>
              </div>
            </form>
          ) : active ? (
            <form className="form-grid" onSubmit={handleUpdate}>
              <h3>{active.tradeName || active.legalName}</h3>
              <CompanyFields form={form} setForm={setForm} />
              <div className="button-row">
                <button className="button" disabled={saving || !canWrite} type="submit">
                  {saving ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>
            </form>
          ) : (
            <div className="empty-state">Selecione uma empresa na lista.</div>
          )}
        </article>
      </section>
    </>
  );
}

function CompanyFields({
  form,
  setForm,
}: {
  form: CompanyForm;
  setForm: (value: CompanyForm | ((current: CompanyForm) => CompanyForm)) => void;
}) {
  return (
    <>
      <label className="field">
        <span>Razão social</span>
        <input required value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
      </label>
      <label className="field">
        <span>Nome fantasia</span>
        <input value={form.tradeName} onChange={(event) => setForm({ ...form, tradeName: event.target.value })} />
      </label>
      <label className="field">
        <span>CNPJ</span>
        <input value={form.cnpj} onChange={(event) => setForm({ ...form, cnpj: event.target.value })} />
      </label>
    </>
  );
}
