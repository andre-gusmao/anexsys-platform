"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceManager, useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useWorkspaceSearchParams } from "@/components/app-shell/workspace-pane";
import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import {
  applyMeasurementListFilters,
  buildMeasurementExcelCsv,
  type MeasurementListRecord,
} from "@/components/measurements/measurement-list";
import { useSession } from "@/components/providers/session-provider";
import { CadastroListPanel } from "@/components/ui/cadastro-list-panel";
import {
  MasterDataDuplicateGuard,
  normalizeBodyPartCodeValue,
  normalizeCodeValue,
} from "@/components/ui/master-data-duplicate-guard";
import { WorkspaceFlash, describeWorkspaceError } from "@/components/ui/workspace-flash";

type WorkspaceMode = "body-parts" | "units";

type MeasurementForm = {
  code: string;
  displayName: string;
  sortOrder: string;
};

type Props = {
  mode: WorkspaceMode;
};

const emptyForm = (): MeasurementForm => ({
  code: "",
  displayName: "",
  sortOrder: "0",
});

function mapRecordToForm(record: MeasurementListRecord): MeasurementForm {
  return {
    code: record.code,
    displayName: record.displayName,
    sortOrder: String(record.sortOrder ?? 0),
  };
}

function toListRecord(record: { id: string; code?: string; displayName: string; sortOrder: number }): MeasurementListRecord {
  return {
    id: record.id,
    code: record.code ?? "",
    displayName: record.displayName,
    sortOrder: record.sortOrder,
  };
}

export function MeasurementMasterDataWorkspace({ mode }: Props) {
  const searchParams = useWorkspaceSearchParams();
  const { hasAnyPermission, apiJson } = useSession();
  const { isMobile } = useWorkspaceViewportMode();
  const workspaceMode = searchParams.get("workspaceMode");
  const focusRecordId = searchParams.get("focusRecordId");
  const prefillName = searchParams.get("prefillName") ?? "";
  const canRead = hasAnyPermission("measurements.read");
  const canWrite = hasAnyPermission("measurements.write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<MeasurementListRecord[]>([]);
  const [form, setForm] = useWorkspaceScopedState<MeasurementForm>(`measurement-master.${mode}.form`, emptyForm());
  const [duplicateStatus, setDuplicateStatus] = useState<"idle" | "checking" | "duplicate">("idle");
  const [duplicateMatch, setDuplicateMatch] = useState<MeasurementListRecord | null>(null);

  const config = useMemo(
    () =>
      mode === "body-parts"
        ? {
            title: "Partes do corpo",
            description: "Padronize as partes do corpo usadas nas medidas dos clientes.",
            endpoint: "/measurement-body-parts",
            entityLabel: "parte do corpo",
            createLabel: "Parte do corpo: Nova",
          }
        : {
            title: "Unidades de medida",
            description: "Gerencie as unidades usadas nas medições padronizadas.",
            endpoint: "/measurement-units",
            entityLabel: "unidade de medida",
            createLabel: "Unidade: Nova",
          },
    [mode],
  );
  const basePath = mode === "body-parts" ? "/body-parts" : "/measurement-units";
  const { closeWorkspace } = useWorkspaceManager();
  const isFormWorkspace = workspaceMode === "new" || Boolean(focusRecordId);
  const isListWorkspace = !isFormWorkspace;
  const activeRecord = useMemo(
    () => records.find((record) => record.id === focusRecordId) ?? null,
    [focusRecordId, records],
  );
  const { currentTabId, navigateWithinWorkspace, openWorkspaceInNewTab } = useWorkspaceRegistration({
    label: workspaceMode === "new" ? config.createLabel : activeRecord ? `${config.title}: ${activeRecord.displayName}` : config.title,
    subtitle: workspaceMode === "new" ? "Novo cadastro" : activeRecord?.code || null,
  });

  const recordLookupOptions = useMemo(
    () =>
      records.map((record) => ({
        id: record.id,
        label: record.displayName,
        hint: record.code || undefined,
      })),
    [records],
  );

  const loadRecords = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiJson<Array<{ id: string; code?: string; displayName: string; sortOrder: number }>>(config.endpoint);
      setRecords(response.map(toListRecord));
      setMessage(null);
    } catch (error) {
      setRecords([]);
      setMessage(describeWorkspaceError(error, `As ${config.title.toLowerCase()} não puderam ser carregadas.`));
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

  const clearDuplicate = useCallback(() => {
    setDuplicateStatus("idle");
    setDuplicateMatch(null);
  }, []);

  const checkDuplicate = useCallback(() => {
    setDuplicateStatus("checking");
    const duplicate =
      records.find((record) => {
        if (record.id === focusRecordId) {
          return false;
        }
        return mode === "body-parts"
          ? normalizeBodyPartCodeValue(record.displayName) === normalizeBodyPartCodeValue(form.displayName)
          : normalizeCodeValue(record.code) === normalizeCodeValue(form.code);
      }) ?? null;
    setDuplicateMatch(duplicate);
    setDuplicateStatus(duplicate ? "duplicate" : "idle");
  }, [focusRecordId, form.code, form.displayName, mode, records]);

  const openCreateWorkspace = useCallback(
    (name?: string) => {
      const params = new URLSearchParams();
      params.set("workspaceMode", "new");
      if (name?.trim()) {
        params.set("prefillName", name.trim());
      }
      const targetPath = `${basePath}?${params.toString()}`;
      if (isMobile) {
        navigateWithinWorkspace(targetPath);
        return;
      }
      openWorkspaceInNewTab(targetPath, config.createLabel, { cloneCurrent: false, subtitle: "Novo cadastro" });
    },
    [basePath, config.createLabel, isMobile, navigateWithinWorkspace, openWorkspaceInNewTab],
  );

  const openEditWorkspace = useCallback(
    (record: Pick<MeasurementListRecord, "id" | "displayName" | "code">) => {
      const targetPath = `${basePath}?focusRecordId=${encodeURIComponent(record.id)}`;
      if (isMobile) {
        navigateWithinWorkspace(targetPath);
        return;
      }
      openWorkspaceInNewTab(targetPath, `${config.title}: ${record.displayName}`, {
        cloneCurrent: false,
        subtitle: record.code || null,
      });
    },
    [basePath, config.title, isMobile, navigateWithinWorkspace, openWorkspaceInNewTab],
  );

  const closeFormWorkspace = useCallback(() => {
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

  useEffect(() => {
    if (workspaceMode !== "new") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setForm({
        ...emptyForm(),
        displayName: prefillName.trim(),
        code: mode === "units" ? prefillName.trim().slice(0, 12).toUpperCase() : "",
      });
      clearDuplicate();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [clearDuplicate, mode, prefillName, setForm, workspaceMode]);

  useEffect(() => {
    if (!focusRecordId || workspaceMode === "new") {
      return;
    }
    const record = records.find((item) => item.id === focusRecordId);
    if (!record) {
      return;
    }
    setForm(mapRecordToForm(record));
    clearDuplicate();
  }, [clearDuplicate, focusRecordId, records, setForm, workspaceMode]);

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
      const created = await apiJson<{ id: string; code?: string; displayName: string; sortOrder: number }>(config.endpoint, {
        method: "POST",
        body: JSON.stringify(
          mode === "body-parts"
            ? { displayName: form.displayName, sortOrder: Number(form.sortOrder || 0) }
            : { code: form.code, displayName: form.displayName || undefined, sortOrder: Number(form.sortOrder || 0) },
        ),
      });
      const mapped = toListRecord(created);
      setRecords((current) => [...current, mapped].sort((left, right) => left.sortOrder - right.sortOrder || left.displayName.localeCompare(right.displayName)));
      setForm(mapRecordToForm(mapped));
      navigateWithinWorkspace(`${basePath}?focusRecordId=${encodeURIComponent(mapped.id)}`);
      setMessage(mode === "body-parts" ? "Parte do corpo criada." : "Unidade de medida criada.");
    } catch (error) {
      setMessage(describeWorkspaceError(error, `A ${config.entityLabel} não pôde ser criada.`));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite || !activeRecord) return;
    if (duplicateStatus !== "idle") {
      setMessage("Revise a duplicidade detectada antes de salvar o cadastro.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiJson<{ id: string; code?: string; displayName: string; sortOrder: number }>(
        `${config.endpoint}/${activeRecord.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            mode === "body-parts"
              ? { displayName: form.displayName, sortOrder: Number(form.sortOrder || 0) }
              : { code: form.code, displayName: form.displayName, sortOrder: Number(form.sortOrder || 0) },
          ),
        },
      );
      const mapped = toListRecord(updated);
      setRecords((current) => current.map((record) => (record.id === mapped.id ? mapped : record)));
      setForm(mapRecordToForm(mapped));
      setMessage(mode === "body-parts" ? "Parte do corpo atualizada." : "Unidade de medida atualizada.");
    } catch (error) {
      setMessage(describeWorkspaceError(error, `A ${config.entityLabel} não pôde ser atualizada.`));
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
      {!isListWorkspace ? (
        <section className="hero-card">
          <div className="eyebrow">Cadastros</div>
          <h1 className="title">{workspaceMode === "new" ? config.createLabel : activeRecord?.displayName ?? config.title}</h1>
          <p>{config.description}</p>
        </section>
      ) : null}

      {message ? <WorkspaceFlash message={message} /> : null}

      {isListWorkspace ? (
        <CadastroListPanel
          applyFilters={applyMeasurementListFilters}
          buildExcelCsv={buildMeasurementExcelCsv}
          canWrite={canWrite}
          columnStorageKey={`anexsys.frontend.${mode}.grid-columns.v1`}
          columns={[
            {
              id: "name",
              label: "Nome",
              locked: true,
              render: (row) => (
                <>
                  <strong>{row.displayName}</strong>
                  {row.code ? <div className="table-subtle">{row.code}</div> : null}
                </>
              ),
            },
            { id: "code", label: "Código", render: (row) => row.code || "—" },
            { id: "sortOrder", label: "Ordem", render: (row) => String(row.sortOrder) },
          ]}
          defaultColumnIds={mode === "units" ? ["name", "code", "sortOrder"] : ["name", "sortOrder"]}
          emptyFilters={{ name: "", code: "" }}
          emptyMessage="Nenhum registro encontrado para os filtros informados."
          excelFileName={mode === "body-parts" ? "partes-do-corpo.csv" : "unidades-de-medida.csv"}
          filterFields={[
            { id: "name", label: "Nome", lookup: true, placeholder: "Nome já cadastrado" },
            { id: "code", label: "Código" },
          ]}
          loading={loading}
          onCreate={openCreateWorkspace}
          onEdit={openEditWorkspace}
          records={records}
          rowLabel={(row) => row.displayName}
          searchKey="name"
          searchOptions={recordLookupOptions}
          searchPlaceholder="Buscar por nome"
          title={config.title}
        />
      ) : (
        <section className="workspace-stack">
          <article className="mini-card cadastro-form">
            <form className="form-grid" onSubmit={workspaceMode === "new" ? handleCreate : handleUpdate}>
              <h3>{workspaceMode === "new" ? "Novo cadastro" : activeRecord?.displayName ?? "Alterar"}</h3>
              {mode === "units" ? (
                <label className="field">
                  <span>Código</span>
                  <input
                    required
                    placeholder="CM"
                    value={form.code}
                    onBlur={checkDuplicate}
                    onChange={(event) => {
                      clearDuplicate();
                      setForm((current) => ({ ...current, code: event.target.value }));
                    }}
                  />
                </label>
              ) : null}
              <label className="field">
                <span>{mode === "body-parts" ? "Nome da parte do corpo" : "Nome exibido"}</span>
                <input
                  required
                  placeholder={mode === "body-parts" ? "Busto" : "Centímetros"}
                  value={form.displayName}
                  onBlur={checkDuplicate}
                  onChange={(event) => {
                    clearDuplicate();
                    setForm((current) => ({ ...current, displayName: event.target.value }));
                  }}
                />
              </label>
              <MasterDataDuplicateGuard
                entityLabel={config.entityLabel}
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
                    setForm((current) => ({ ...current, displayName: "" }));
                  } else {
                    setForm((current) => ({ ...current, code: "" }));
                  }
                }}
                status={duplicateStatus}
                variant="warning"
              />
              <label className="field">
                <span>Ordem</span>
                <input
                  inputMode="numeric"
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                />
              </label>
              <div className="button-row">
                <button className="button" disabled={saving || duplicateStatus !== "idle"} type="submit">
                  {saving ? "Salvando…" : workspaceMode === "new" ? "Salvar" : "Salvar alterações"}
                </button>
                <button className="button-secondary" onClick={closeFormWorkspace} type="button">
                  Cancelar
                </button>
              </div>
            </form>
          </article>
        </section>
      )}
    </>
  );
}
