"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/providers/session-provider";

type BodyPartRecord = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
};

type UnitRecord = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
};

type WorkspaceMode = "body-parts" | "units";

type Props = {
  mode: WorkspaceMode;
};

export function MeasurementMasterDataWorkspace({ mode }: Props) {
  const { hasAnyPermission, apiJson } = useSession();
  const canRead = hasAnyPermission("measurements.read");
  const canWrite = hasAnyPermission("measurements.write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<Array<BodyPartRecord | UnitRecord>>([]);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [editing, setEditing] = useState<Record<string, { displayName: string; code?: string; sortOrder: string }>>({});

  const config = useMemo(
    () =>
      mode === "body-parts"
        ? {
            title: "Partes do corpo",
            description: "Padronize as partes do corpo disponíveis para o cadastro de medidas dos clientes.",
            endpoint: "/measurement-body-parts",
            createButton: "Cadastrar parte do corpo",
          }
        : {
            title: "Unidades de medida",
            description: "Gerencie as unidades de medida válidas para medições padronizadas e reutilizáveis.",
            endpoint: "/measurement-units",
            createButton: "Cadastrar unidade",
          },
    [mode],
  );

  const loadRecords = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiJson<Array<BodyPartRecord | UnitRecord>>(config.endpoint);
      setRecords(response);
      setEditing(
        Object.fromEntries(
          response.map((record) => [
            record.id,
            {
              displayName: record.displayName,
              code: "code" in record ? record.code : undefined,
              sortOrder: String(record.sortOrder ?? 0),
            },
          ]),
        ),
      );
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `The ${config.title.toLowerCase()} list could not be loaded.`);
    } finally {
      setLoading(false);
    }
  }, [apiJson, canRead, config.endpoint, config.title]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecords();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRecords]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(config.endpoint, {
        method: "POST",
        body: JSON.stringify(
          mode === "body-parts"
            ? { displayName: newDisplayName, sortOrder: Number(newSortOrder || 0) }
            : { code: newCode, displayName: newDisplayName || undefined, sortOrder: Number(newSortOrder || 0) },
        ),
      });
      setNewDisplayName("");
      setNewCode("");
      setNewSortOrder("0");
      setMessage(`${config.title} updated successfully.`);
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `The ${config.title.toLowerCase()} record could not be saved.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!canWrite) return;
    const current = editing[id];
    if (!current) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(`${config.endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(
          mode === "body-parts"
            ? { displayName: current.displayName, sortOrder: Number(current.sortOrder || 0) }
            : {
                code: current.code,
                displayName: current.displayName,
                sortOrder: Number(current.sortOrder || 0),
              },
        ),
      });
      setMessage(`${config.title} updated successfully.`);
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `The ${config.title.toLowerCase()} record could not be updated.`);
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <section className="mini-card">
        <h3>{config.title} indisponíveis</h3>
        <p>Você não possui acesso ao cadastro de {config.title.toLowerCase()} no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Cadastros</div>
        <h1 className="title">{config.title}</h1>
        <p>{config.description}</p>
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
              <h3>Cadastros ativos</h3>
              <p>{loading ? "Carregando…" : `${records.length} registro(s) disponível(is)`}</p>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {mode === "units" ? <th>Código</th> : null}
                  <th>Nome</th>
                  <th>Ordem</th>
                  {canWrite ? <th>Ações</th> : null}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    {mode === "units" ? (
                      <td>
                        <input
                          disabled={!canWrite}
                          value={editing[record.id]?.code ?? ""}
                          onChange={(event) =>
                            setEditing((current) => ({
                              ...current,
                              [record.id]: { ...current[record.id], code: event.target.value },
                            }))
                          }
                        />
                      </td>
                    ) : null}
                    <td>
                      <input
                        disabled={!canWrite}
                        value={editing[record.id]?.displayName ?? ""}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [record.id]: { ...current[record.id], displayName: event.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        disabled={!canWrite}
                        inputMode="numeric"
                        value={editing[record.id]?.sortOrder ?? "0"}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            [record.id]: { ...current[record.id], sortOrder: event.target.value },
                          }))
                        }
                      />
                    </td>
                    {canWrite ? (
                      <td>
                        <button
                          aria-label={`Salvar ${mode === "units" ? `unidade ${editing[record.id]?.code ?? record.id}` : `parte do corpo ${editing[record.id]?.displayName ?? record.id}`}`}
                          className="button-secondary"
                          disabled={saving}
                          onClick={() => void handleUpdate(record.id)}
                          type="button"
                        >
                          Salvar
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!loading && records.length === 0 ? (
                  <tr>
                    <td colSpan={mode === "units" ? 4 : 3}>
                      <div className="empty-state">Nenhum registro disponível.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        {canWrite ? (
          <article className="mini-card">
            <h3>Novo cadastro</h3>
            <form className="form-grid" onSubmit={handleCreate}>
              {mode === "units" ? (
                <label className="field">
                  <span>Código</span>
                  <input required placeholder="CM" value={newCode} onChange={(event) => setNewCode(event.target.value)} />
                </label>
              ) : null}
              <label className="field">
                <span>{mode === "body-parts" ? "Nome da parte do corpo" : "Nome exibido"}</span>
                <input required placeholder={mode === "body-parts" ? "Busto" : "Centímetros"} value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} />
              </label>
              <label className="field">
                <span>Ordem</span>
                <input inputMode="numeric" value={newSortOrder} onChange={(event) => setNewSortOrder(event.target.value)} />
              </label>
              <div className="button-row">
                <button className="button" disabled={saving} type="submit">
                  {saving ? "Salvando…" : config.createButton}
                </button>
              </div>
            </form>
          </article>
        ) : null}
      </section>
    </>
  );
}
