"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceManager, useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useWorkspaceSearchParams } from "@/components/app-shell/workspace-pane";
import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import { useSession } from "@/components/providers/session-provider";
import {
  MasterDataDuplicateGuard,
  normalizeBodyPartCodeValue,
  normalizeCodeValue,
} from "@/components/ui/master-data-duplicate-guard";

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
  const searchParams = useWorkspaceSearchParams();
  const { hasAnyPermission, apiJson } = useSession();
  const { isMobile } = useWorkspaceViewportMode();
  const workspaceMode = searchParams.get("workspaceMode");
  const canRead = hasAnyPermission("measurements.read");
  const canWrite = hasAnyPermission("measurements.write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<Array<BodyPartRecord | UnitRecord>>([]);
  const [searchQuery, setSearchQuery] = useWorkspaceScopedState(`measurement-master.${mode}.searchQuery`, "");
  const [newDisplayName, setNewDisplayName] = useWorkspaceScopedState(`measurement-master.${mode}.newDisplayName`, "");
  const [newCode, setNewCode] = useWorkspaceScopedState(`measurement-master.${mode}.newCode`, "");
  const [newSortOrder, setNewSortOrder] = useWorkspaceScopedState(`measurement-master.${mode}.newSortOrder`, "0");
  const [editing, setEditing] = useWorkspaceScopedState<Record<string, { displayName: string; code?: string; sortOrder: string }>>(
    `measurement-master.${mode}.editing`,
    {},
  );
  const [duplicateStatus, setDuplicateStatus] = useState<"idle" | "checking" | "duplicate">("idle");
  const [duplicateMatch, setDuplicateMatch] = useState<BodyPartRecord | UnitRecord | null>(null);

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
  const basePath = mode === "body-parts" ? "/body-parts" : "/measurement-units";
  const { closeWorkspace } = useWorkspaceManager();
  const { currentTabId, navigateWithinWorkspace, openWorkspaceInNewTab } = useWorkspaceRegistration({
    label: workspaceMode === "new" ? (mode === "body-parts" ? "Body Part: New" : "Measurement Unit: New") : config.title,
  });
  const isFormWorkspace = workspaceMode === "new";
  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [record.displayName, "code" in record ? record.code : ""].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [records, searchQuery]);

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
      setRecords([]);
      setEditing({});
      setMessage(error instanceof Error ? error.message : `The ${config.title.toLowerCase()} list could not be loaded.`);
    } finally {
      setLoading(false);
    }
  }, [apiJson, canRead, config.endpoint, config.title, setEditing]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecords();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRecords]);

  useEffect(() => {
    if (workspaceMode !== "new") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById("measurement-master-create-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [workspaceMode]);

  const clearDuplicate = useCallback(() => {
    setDuplicateStatus("idle");
    setDuplicateMatch(null);
  }, []);

  const checkDuplicate = useCallback(() => {
    setDuplicateStatus("checking");
    const duplicate =
      records.find((record) =>
        mode === "body-parts"
          ? normalizeBodyPartCodeValue(record.displayName) === normalizeBodyPartCodeValue(newDisplayName)
          : normalizeCodeValue("code" in record ? record.code : "") === normalizeCodeValue(newCode),
      ) ?? null;
    setDuplicateMatch(duplicate);
    setDuplicateStatus(duplicate ? "duplicate" : "idle");
  }, [mode, newCode, newDisplayName, records]);

  const openCreateWorkspace = useCallback(() => {
    const targetPath = `${basePath}?workspaceMode=new`;
    const label = mode === "body-parts" ? "Body Part: New" : "Measurement Unit: New";
    if (isMobile) {
      navigateWithinWorkspace(targetPath);
      return;
    }

    openWorkspaceInNewTab(targetPath, label, { cloneCurrent: false });
  }, [basePath, isMobile, mode, navigateWithinWorkspace, openWorkspaceInNewTab]);

  const closeCreateWorkspace = useCallback(() => {
    if (!currentTabId || isMobile) {
      navigateWithinWorkspace(basePath);
      return;
    }

    const closingTabId = currentTabId;
    openWorkspaceInNewTab(basePath, config.title, { cloneCurrent: false });
    window.setTimeout(() => {
      closeWorkspace(closingTabId);
    }, 0);
  }, [basePath, closeWorkspace, config.title, currentTabId, isMobile, navigateWithinWorkspace, openWorkspaceInNewTab]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    if (duplicateStatus !== "idle") {
      setMessage("Revise a duplicidade detectada antes de salvar o cadastro.");
      return;
    }
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
      clearDuplicate();
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
        {!isFormWorkspace ? (
          <article className="mini-card">
            <div className="workspace-toolbar">
              <div className="workspace-toolbar__copy">
                <h3>Cadastros ativos</h3>
                <p>{loading ? "Carregando…" : `${filteredRecords.length} registro(s) disponível(is)`}</p>
              </div>
              {canWrite ? (
                <button className="button" onClick={openCreateWorkspace} type="button">
                  Add
                </button>
              ) : null}
            </div>

            <div className="filters-grid">
              <label className="field">
                <span>Filtro</span>
                <input placeholder={mode === "body-parts" ? "Buscar parte do corpo" : "Buscar código ou nome"} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              </label>
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
                  {filteredRecords.map((record) => (
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
                  {!loading && filteredRecords.length === 0 ? (
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
        ) : null}

        {canWrite && isFormWorkspace ? (
          <article className="mini-card" id="measurement-master-create-form">
            <h3>Novo cadastro</h3>
            <form className="form-grid" onSubmit={handleCreate}>
              {mode === "units" ? (
                <label className="field">
                  <span>Código</span>
                  <input
                    required
                    placeholder="CM"
                    value={newCode}
                    onBlur={checkDuplicate}
                    onChange={(event) => {
                      clearDuplicate();
                      setNewCode(event.target.value);
                    }}
                  />
                </label>
              ) : null}
              <label className="field">
                <span>{mode === "body-parts" ? "Nome da parte do corpo" : "Nome exibido"}</span>
                <input
                  required
                  placeholder={mode === "body-parts" ? "Busto" : "Centímetros"}
                  value={newDisplayName}
                  onBlur={checkDuplicate}
                  onChange={(event) => {
                    clearDuplicate();
                    setNewDisplayName(event.target.value);
                  }}
                />
              </label>
              <MasterDataDuplicateGuard
                entityLabel={mode === "body-parts" ? "parte do corpo" : "unidade de medida"}
                match={
                  duplicateMatch
                    ? {
                        id: duplicateMatch.id,
                        title: mode === "body-parts" ? duplicateMatch.displayName : duplicateMatch.code,
                        subtitle: mode === "body-parts" ? duplicateMatch.code : duplicateMatch.displayName,
                      }
                    : null
                }
                onCancel={() => {
                  clearDuplicate();
                  if (mode === "body-parts") {
                    setNewDisplayName("");
                  } else {
                    setNewCode("");
                  }
                }}
                status={duplicateStatus}
                variant="warning"
              />
              <label className="field">
                <span>Ordem</span>
                <input inputMode="numeric" value={newSortOrder} onChange={(event) => setNewSortOrder(event.target.value)} />
              </label>
              <div className="button-row">
                <button className="button" disabled={saving || duplicateStatus !== "idle"} type="submit">
                  {saving ? "Salvando…" : "Save"}
                </button>
                <button className="button-secondary" onClick={closeCreateWorkspace} type="button">
                  Close
                </button>
              </div>
            </form>
          </article>
        ) : null}
      </section>
    </>
  );
}
