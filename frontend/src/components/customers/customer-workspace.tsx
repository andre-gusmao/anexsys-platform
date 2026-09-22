"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useSession } from "@/components/providers/session-provider";

type CustomerType = "person" | "company";
type CustomerStatus = "active" | "inactive" | "blocked";

type CustomerRecord = {
  id: string;
  branchId: string | null;
  customerType: CustomerType;
  legalName: string;
  tradeName: string | null;
  cpfCnpj: string | null;
  email: string | null;
  phone: string;
  birthDate: string | null;
  postalCode?: string | null;
  observations: string | null;
  status: CustomerStatus;
  createdAt?: string;
  updatedAt?: string;
};

type CustomerContact = {
  id: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

type CustomerInteraction = {
  id: string;
  interactionType: string;
  summary: string;
  detail: string | null;
  occurredAt: string;
};

type MeasurementRecord = {
  id: string;
  measurementLabel: string;
  measurementSetId: string;
  measurementData: {
    value?: number;
    unit?: string | null;
    notes?: string | null;
    displayName?: string | null;
    bodyPartId?: string | null;
    unitId?: string | null;
  };
  versionNo: number;
  measuredAt: string;
};

type MeasurementSetItem = {
  id: string;
  bodyPartId: string;
  bodyPartCode: string;
  bodyPartDisplayName: string;
  measurementUnitId: string;
  measurementUnitCode: string;
  measurementUnitDisplayName: string;
  measuredValue: number;
  notes: string | null;
};

type MeasurementSet = {
  id: string;
  customerId: string;
  measurementDate: string;
  notes: string | null;
  createdBy: string;
  versionNo: number;
  items: MeasurementSetItem[];
};

type BodyPartRecord = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
};

type MeasurementUnitRecord = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
};

type MeasurementCatalogResponse = {
  bodyParts: BodyPartRecord[];
  units: MeasurementUnitRecord[];
  defaultUnitCode: string;
  defaultUnitId: string | null;
};

type CustomerProfileResponse = {
  customer: CustomerRecord;
  contacts: CustomerContact[];
  interactions: CustomerInteraction[];
  latestMeasurements: MeasurementRecord[];
};

type MeasurementHistoryResponse = {
  history: MeasurementRecord[];
  latestByLabel: MeasurementRecord[];
  measurementSets: MeasurementSet[];
};

type CustomerFormState = {
  branchId: string;
  customerType: CustomerType;
  fullName: string;
  tradeName: string;
  mobilePhone: string;
  cpf: string;
  email: string;
  birthDate: string;
  postalCode: string;
  observations: string;
  status: CustomerStatus;
};

type MeasurementDraft = {
  bodyPartId: string;
  unitId: string;
  value: string;
  notes: string;
};

const defaultCustomerForm = (): CustomerFormState => ({
  branchId: "",
  customerType: "person",
  fullName: "",
  tradeName: "",
  mobilePhone: "",
  cpf: "",
  email: "",
  birthDate: "",
  postalCode: "",
  observations: "",
  status: "active",
});

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

function createMeasurementDraft(defaultUnitId?: string | null): MeasurementDraft {
  return {
    bodyPartId: "",
    unitId: defaultUnitId ?? "",
    value: "",
    notes: "",
  };
}

function formatPhone(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length === 11) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  }
  if (value.length === 10) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  }
  return value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function mapCustomerToForm(customer: CustomerRecord): CustomerFormState {
  return {
    branchId: customer.branchId ?? "",
    customerType: customer.customerType,
    fullName: customer.legalName,
    tradeName: customer.tradeName ?? "",
    mobilePhone: customer.phone ?? "",
    cpf: customer.cpfCnpj ?? "",
    email: customer.email ?? "",
    birthDate: customer.birthDate ?? "",
    postalCode: customer.postalCode ?? "",
    observations: customer.observations ?? "",
    status: customer.status,
  };
}

export function CustomerWorkspace() {
  const { session, hasAnyPermission, apiJson } = useSession();
  const canWriteCustomers = hasAnyPermission("customers.write");
  const canReadMeasurements = hasAnyPermission("measurements.read");
  const canWriteMeasurements = hasAnyPermission("measurements.write");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementHistoryResponse | null>(null);
  const [catalog, setCatalog] = useState<MeasurementCatalogResponse | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(defaultCustomerForm);
  const [measurementForm, setMeasurementForm] = useState({
    measurementDate: todayIsoDate(),
    notes: "",
    items: [createMeasurementDraft(null)] as MeasurementDraft[],
  });

  const branchOptions = useMemo(() => session?.branches ?? [], [session?.branches]);
  const branchNameById = useMemo(() => new Map(branchOptions.map((branch) => [branch.id, branch.label])), [branchOptions]);
  const bodyPartOptions = useMemo(() => catalog?.bodyParts ?? [], [catalog]);
  const unitOptions = useMemo(() => catalog?.units ?? [], [catalog]);

  const resetMeasurementForm = useCallback(
    () =>
      setMeasurementForm({
        measurementDate: todayIsoDate(),
        notes: "",
        items: [createMeasurementDraft(catalog?.defaultUnitId)],
      }),
    [catalog?.defaultUnitId],
  );

  const loadCatalog = useCallback(async () => {
    if (!canReadMeasurements) return;
    try {
      const response = await apiJson<MeasurementCatalogResponse>("/measurement-catalog");
      setCatalog(response);
      setMeasurementForm((current) => ({
        ...current,
        items:
          current.items.length > 0
            ? current.items.map((item) => ({ ...item, unitId: item.unitId || response.defaultUnitId || "" }))
            : [createMeasurementDraft(response.defaultUnitId)],
      }));
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Measurement catalog could not be loaded.");
    }
  }, [apiJson, canReadMeasurements]);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("customerType", typeFilter);
      if (branchFilter) params.set("branchId", branchFilter);
      const suffix = params.toString() ? `?${params}` : "";
      const response = await apiJson<CustomerRecord[]>(`/customers${suffix}`);
      setCustomers(response);
      setWorkspaceMessage(null);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Customers could not be loaded.");
    } finally {
      setLoadingCustomers(false);
    }
  }, [apiJson, branchFilter, searchQuery, statusFilter, typeFilter]);

  const loadCustomerDetails = useCallback(
    async (customerId: string) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const [profileResponse, measurementResponse] = await Promise.all([
          apiJson<CustomerProfileResponse>(`/customers/${customerId}`),
          canReadMeasurements ? apiJson<MeasurementHistoryResponse>(`/customers/${customerId}/measurements`) : Promise.resolve(null),
        ]);

        setProfile(profileResponse);
        setMeasurements(measurementResponse);
        setCustomerForm(mapCustomerToForm(profileResponse.customer));
        setActiveCustomerId(customerId);
        setShowCreateForm(false);
        resetMeasurementForm();
      } catch (error) {
        setDetailError(error instanceof Error ? error.message : "Customer details could not be loaded.");
      } finally {
        setDetailLoading(false);
      }
    },
    [apiJson, canReadMeasurements, resetMeasurementForm],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCatalog();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCatalog]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCustomers();
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadCustomers]);

  useEffect(() => {
    if (!activeCustomerId && customers.length > 0 && !showCreateForm) {
      const timeoutId = window.setTimeout(() => {
        void loadCustomerDetails(customers[0].id);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [activeCustomerId, customers, loadCustomerDetails, showCreateForm]);

  const selectedCustomer = profile?.customer ?? null;

  const customerSuggestions = useMemo(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: customer.tradeName ? `${customer.legalName} · ${customer.tradeName}` : customer.legalName,
      })),
    [customers],
  );

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCustomer(true);
    setWorkspaceMessage(null);
    try {
      const created = await apiJson<CustomerRecord>("/customers", {
        method: "POST",
        body: JSON.stringify({
          branchId: customerForm.branchId || undefined,
          customerType: customerForm.customerType,
          fullName: customerForm.fullName,
          tradeName: customerForm.tradeName || undefined,
          mobilePhone: customerForm.mobilePhone,
          cpf: customerForm.cpf || undefined,
          email: customerForm.email || undefined,
          birthDate: customerForm.birthDate || undefined,
          postalCode: customerForm.postalCode || undefined,
          observations: customerForm.observations || undefined,
        }),
      });
      setWorkspaceMessage("Customer created successfully.");
      setCustomerForm(defaultCustomerForm());
      await loadCustomers();
      await loadCustomerDetails(created.id);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Customer could not be created.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleUpdateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) return;
    setSavingCustomer(true);
    setWorkspaceMessage(null);
    try {
      const nextStatus = customerForm.status === "blocked" ? undefined : customerForm.status;
      await apiJson<CustomerRecord>(`/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          branchId: customerForm.branchId || null,
          customerType: customerForm.customerType,
          fullName: customerForm.fullName,
          tradeName: customerForm.tradeName || null,
          mobilePhone: customerForm.mobilePhone,
          cpf: customerForm.cpf || null,
          email: customerForm.email || null,
          birthDate: customerForm.birthDate || null,
          postalCode: customerForm.postalCode || null,
          observations: customerForm.observations || null,
          status: nextStatus,
        }),
      });
      setWorkspaceMessage("Customer updated successfully.");
      await loadCustomers();
      await loadCustomerDetails(selectedCustomer.id);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Customer could not be updated.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleCreateMeasurements(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) return;
    setSavingMeasurements(true);
    setWorkspaceMessage(null);
    try {
      const items = measurementForm.items
        .filter((item) => item.bodyPartId && item.value.trim())
        .map((item) => ({
          bodyPartId: item.bodyPartId,
          unitId: item.unitId || undefined,
          value: Number(item.value),
          notes: item.notes || undefined,
        }));

      if (items.length === 0) {
        throw new Error("Add at least one valid measurement item before saving the Measurement Set.");
      }

      await apiJson<MeasurementSet>(`/customers/${selectedCustomer.id}/measurements`, {
        method: "POST",
        body: JSON.stringify({
          measurementDate: measurementForm.measurementDate,
          notes: measurementForm.notes || undefined,
          items,
        }),
      });
      setWorkspaceMessage("Measurement set recorded successfully.");
      resetMeasurementForm();
      await loadCustomerDetails(selectedCustomer.id);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Measurements could not be recorded.");
    } finally {
      setSavingMeasurements(false);
    }
  }

  if (!hasAnyPermission("customers.read")) {
    return (
      <section className="mini-card">
        <h3>Clientes indisponíveis</h3>
        <p>Você não possui acesso ao cadastro de clientes no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Módulo operacional</div>
        <h1 className="title">Cadastro de clientes</h1>
        <p>Cadastre clientes, pesquise rapidamente, edite dados cadastrais e mantenha Measurement Sets versionados com partes do corpo e unidades padronizadas.</p>
      </section>

      {workspaceMessage ? (
        <div className="mini-card">
          <p>{workspaceMessage}</p>
        </div>
      ) : null}

      <section className="mini-card">
        <div className="workspace-toolbar">
          <div className="workspace-toolbar__copy">
            <h3>Pesquisa de clientes</h3>
            <p>O autocomplete ajuda a localizar clientes rapidamente sem sair do fluxo operacional.</p>
          </div>
          {canWriteCustomers ? (
            <button
              className="button"
              onClick={() => {
                setShowCreateForm(true);
                setActiveCustomerId(null);
                setProfile(null);
                setMeasurements(null);
                setCustomerForm(defaultCustomerForm());
              }}
              type="button"
            >
              Novo cliente
            </button>
          ) : null}
        </div>

        <div className="filters-grid">
          <label className="field">
            <span>Busca</span>
            <input list="customer-suggestions" placeholder="Nome, telefone, CPF/CNPJ ou email" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            <datalist id="customer-suggestions">
              {customerSuggestions.map((customer) => (
                <option key={customer.id} value={customer.label} />
              ))}
            </datalist>
          </label>

          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>

          <label className="field">
            <span>Tipo de cliente</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="person">Pessoa</option>
              <option value="company">Empresa</option>
            </select>
          </label>

          <label className="field">
            <span>Filial</span>
            <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
              <option value="">Todas as filiais visíveis</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="workspace-split">
        <article className="mini-card">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar__copy">
              <h3>Grade de clientes</h3>
              <p>{loadingCustomers ? "Carregando clientes…" : `${customers.length} cliente(s) encontrado(s)`}</p>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Filial</th>
                  <th>Status</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr className={customer.id === activeCustomerId ? "data-table__row--active" : ""} key={customer.id}>
                    <td>
                      <button
                        className="button-ghost"
                        onClick={() => void loadCustomerDetails(customer.id)}
                        style={{ alignItems: "start", display: "grid", justifyItems: "start", textAlign: "left" }}
                        type="button"
                      >
                        <strong>{customer.legalName}</strong>
                        <div className="table-subtle">{customer.tradeName ?? customer.email ?? "Sem referência secundária"}</div>
                      </button>
                    </td>
                    <td>{customer.customerType === "company" ? "Empresa" : "Pessoa"}</td>
                    <td>{customer.branchId ? branchNameById.get(customer.branchId) ?? "Filial vinculada" : "Compartilhado"}</td>
                    <td>
                      <span className={`status-chip status-chip--${customer.status}`}>{customer.status}</span>
                    </td>
                    <td>{formatPhone(customer.phone)}</td>
                  </tr>
                ))}
                {!loadingCustomers && customers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">Nenhum cliente encontrado para os filtros informados.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <div className="workspace-stack">
          {showCreateForm ? (
            <article className="mini-card">
              <h3>Novo cliente</h3>
              <p className="subtitle">Capture primeiro os dados mínimos operacionais. O relacionamento pode ser enriquecido depois.</p>
              <form className="form-grid" onSubmit={handleCreateCustomer}>
                <CustomerFields branchOptions={branchOptions} form={customerForm} onChange={setCustomerForm} showStatus={false} />
                <div className="button-row">
                  <button className="button" disabled={savingCustomer} type="submit">
                    {savingCustomer ? "Salvando…" : "Cadastrar cliente"}
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCustomerForm(defaultCustomerForm());
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </article>
          ) : null}

          {!showCreateForm ? (
            <article className="mini-card">
              <div className="workspace-toolbar">
                <div className="workspace-toolbar__copy">
                  <h3>Detalhes do cliente</h3>
                  <p>{selectedCustomer ? "Revise cadastro, histórico e Measurement Sets versionados." : "Selecione um cliente na grade."}</p>
                </div>
              </div>

              {detailLoading ? <div className="empty-state">Carregando detalhes do cliente…</div> : null}
              {detailError ? <div className="error-banner">{detailError}</div> : null}

              {selectedCustomer ? (
                <div className="detail-stack">
                  <div className="detail-summary">
                    <div>
                      <div className="eyebrow">Cliente</div>
                      <h2>{selectedCustomer.legalName}</h2>
                      <p className="subtitle">{selectedCustomer.tradeName ?? "Visão geral do relacionamento"}</p>
                    </div>
                    <span className={`status-chip status-chip--${selectedCustomer.status}`}>{selectedCustomer.status}</span>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-field">
                      <span>Telefone</span>
                      <strong>{formatPhone(selectedCustomer.phone)}</strong>
                    </div>
                    <div className="detail-field">
                      <span>Email</span>
                      <strong>{selectedCustomer.email ?? "—"}</strong>
                    </div>
                    <div className="detail-field">
                      <span>Filial</span>
                      <strong>{selectedCustomer.branchId ? branchNameById.get(selectedCustomer.branchId) ?? "Filial vinculada" : "Compartilhado"}</strong>
                    </div>
                    <div className="detail-field">
                      <span>Documento</span>
                      <strong>{selectedCustomer.cpfCnpj ?? "—"}</strong>
                    </div>
                  </div>

                  {canWriteCustomers ? (
                    <form className="form-grid" onSubmit={handleUpdateCustomer}>
                      <CustomerFields branchOptions={branchOptions} form={customerForm} onChange={setCustomerForm} showStatus />
                      <div className="button-row">
                        <button className="button" disabled={savingCustomer} type="submit">
                          {savingCustomer ? "Salvando…" : "Salvar alterações"}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  <section className="mini-section">
                    <h4>Contatos principais</h4>
                    <ul className="placeholder-list">
                      {(profile?.contacts ?? []).map((contact) => (
                        <li key={contact.id}>
                          <strong>{contact.contactName}</strong> · {contact.email ?? "Sem email"} · {formatPhone(contact.phone)}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {canReadMeasurements ? (
                    <section className="mini-section">
                      <div className="workspace-toolbar">
                        <div className="workspace-toolbar__copy">
                          <h4>Gestão de medidas</h4>
                          <p>Registre Measurement Sets versionados com data, observações, partes do corpo padronizadas e unidade padrão automática.</p>
                        </div>
                      </div>

                      <div className="measurement-grid">
                        {(measurements?.latestByLabel ?? []).map((measurement) => (
                          <div className="measurement-card" key={measurement.id}>
                            <span>{measurement.measurementData.displayName ?? measurement.measurementLabel}</span>
                            <strong>
                              {String(measurement.measurementData?.value ?? "—")} {measurement.measurementData?.unit ?? ""}
                            </strong>
                            <small>v{measurement.versionNo} · {formatDate(measurement.measuredAt)}</small>
                          </div>
                        ))}
                        {(measurements?.latestByLabel ?? []).length === 0 ? <div className="empty-state">Nenhuma medida registrada ainda.</div> : null}
                      </div>

                      {canWriteMeasurements ? (
                        <form className="form-grid" onSubmit={handleCreateMeasurements}>
                          <div className="filters-grid">
                            <label className="field">
                              <span>Data da medição</span>
                              <input type="date" value={measurementForm.measurementDate} onChange={(event) => setMeasurementForm((current) => ({ ...current, measurementDate: event.target.value }))} />
                            </label>
                            <label className="field">
                              <span>Unidade padrão</span>
                              <input disabled value={catalog?.defaultUnitCode ?? "CM"} />
                            </label>
                          </div>

                          <label className="field">
                            <span>Observações do conjunto</span>
                            <textarea rows={3} value={measurementForm.notes} onChange={(event) => setMeasurementForm((current) => ({ ...current, notes: event.target.value }))} />
                          </label>

                          {measurementForm.items.map((item, index) => (
                            <div className="custom-measurement-row" key={`measurement-item-${index}`}>
                              <label className="field">
                                <span>Parte do corpo</span>
                                <select
                                  required
                                  value={item.bodyPartId}
                                  onChange={(event) =>
                                    setMeasurementForm((current) => ({
                                      ...current,
                                      items: current.items.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, bodyPartId: event.target.value } : entry,
                                      ),
                                    }))
                                  }
                                >
                                  <option value="">Selecione</option>
                                  {bodyPartOptions.map((bodyPart) => (
                                    <option key={bodyPart.id} value={bodyPart.id}>
                                      {bodyPart.displayName}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Valor</span>
                                <input
                                  inputMode="decimal"
                                  placeholder="86"
                                  required
                                  value={item.value}
                                  onChange={(event) =>
                                    setMeasurementForm((current) => ({
                                      ...current,
                                      items: current.items.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, value: event.target.value } : entry,
                                      ),
                                    }))
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>Unidade</span>
                                <select
                                  value={item.unitId}
                                  onChange={(event) =>
                                    setMeasurementForm((current) => ({
                                      ...current,
                                      items: current.items.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, unitId: event.target.value } : entry,
                                      ),
                                    }))
                                  }
                                >
                                  <option value="">Padrão ({catalog?.defaultUnitCode ?? "CM"})</option>
                                  {unitOptions.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                      {unit.code}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Observações</span>
                                <input
                                  placeholder="Observações opcionais"
                                  value={item.notes}
                                  onChange={(event) =>
                                    setMeasurementForm((current) => ({
                                      ...current,
                                      items: current.items.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, notes: event.target.value } : entry,
                                      ),
                                    }))
                                  }
                                />
                              </label>
                              <div className="button-row" style={{ alignItems: "end" }}>
                                <button
                                  className="button-secondary"
                                  onClick={() =>
                                    setMeasurementForm((current) => ({
                                      ...current,
                                      items:
                                        current.items.length === 1
                                          ? [createMeasurementDraft(catalog?.defaultUnitId)]
                                          : current.items.filter((_, entryIndex) => entryIndex !== index),
                                    }))
                                  }
                                  type="button"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="button-row">
                            <button
                              className="button-secondary"
                              onClick={() =>
                                setMeasurementForm((current) => ({
                                  ...current,
                                  items: [...current.items, createMeasurementDraft(catalog?.defaultUnitId)],
                                }))
                              }
                              type="button"
                            >
                              Adicionar item ao conjunto
                            </button>
                            <button className="button" disabled={savingMeasurements} type="submit">
                              {savingMeasurements ? "Salvando…" : "Registrar Measurement Set"}
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <section className="mini-section">
                        <h4>Histórico completo</h4>
                        <ul className="placeholder-list">
                          {(measurements?.measurementSets ?? []).map((set) => (
                            <li key={set.id}>
                              <strong>Versão {set.versionNo}</strong> · {formatDate(set.measurementDate)} · {set.items.map((item) => `${item.bodyPartDisplayName}: ${item.measuredValue} ${item.measurementUnitCode}`).join(" | ")}
                              <div>{set.notes || `Measurement Set ${set.id}`}</div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </section>
                  ) : null}

                  <section className="mini-section">
                    <h4>Últimas interações</h4>
                    <ul className="placeholder-list">
                      {(profile?.interactions ?? []).slice(0, 6).map((interaction) => (
                        <li key={interaction.id}>
                          <strong>{interaction.summary}</strong>
                          <div>{interaction.detail ?? interaction.interactionType}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : !detailLoading && !detailError ? (
                <div className="empty-state">Selecione um cliente para abrir o cadastro completo.</div>
              ) : null}
            </article>
          ) : null}
        </div>
      </section>
    </>
  );
}

function CustomerFields({
  form,
  onChange,
  branchOptions,
  showStatus,
}: {
  form: CustomerFormState;
  onChange: Dispatch<SetStateAction<CustomerFormState>>;
  branchOptions: Array<{ id: string; label: string }>;
  showStatus: boolean;
}) {
  return (
    <>
      <div className="filters-grid">
        <label className="field">
          <span>Tipo de cliente</span>
          <select value={form.customerType} onChange={(event) => onChange((current) => ({ ...current, customerType: event.target.value as CustomerType }))}>
            <option value="person">Pessoa</option>
            <option value="company">Empresa</option>
          </select>
        </label>

        <label className="field">
          <span>Filial</span>
          <select value={form.branchId} onChange={(event) => onChange((current) => ({ ...current, branchId: event.target.value }))}>
            <option value="">Compartilhado entre as filiais visíveis</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.label}
              </option>
            ))}
          </select>
        </label>

        {showStatus ? (
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(event) => onChange((current) => ({ ...current, status: event.target.value as CustomerStatus }))}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="filters-grid">
        <label className="field">
          <span>Nome completo / razão social</span>
          <input required value={form.fullName} onChange={(event) => onChange((current) => ({ ...current, fullName: event.target.value }))} />
        </label>
        <label className="field">
          <span>Nome fantasia</span>
          <input value={form.tradeName} onChange={(event) => onChange((current) => ({ ...current, tradeName: event.target.value }))} />
        </label>
      </div>

      <div className="filters-grid">
        <label className="field">
          <span>Celular / WhatsApp</span>
          <input required value={form.mobilePhone} onChange={(event) => onChange((current) => ({ ...current, mobilePhone: event.target.value }))} />
        </label>
        <label className="field">
          <span>{form.customerType === "company" ? "CNPJ" : "CPF"}</span>
          <input value={form.cpf} onChange={(event) => onChange((current) => ({ ...current, cpf: event.target.value }))} />
        </label>
      </div>

      <div className="filters-grid">
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))} />
        </label>
        <label className="field">
          <span>Data de nascimento</span>
          <input type="date" value={form.birthDate} onChange={(event) => onChange((current) => ({ ...current, birthDate: event.target.value }))} />
        </label>
        <label className="field">
          <span>CEP</span>
          <input value={form.postalCode} onChange={(event) => onChange((current) => ({ ...current, postalCode: event.target.value }))} />
        </label>
      </div>

      <label className="field">
        <span>Observações</span>
        <textarea rows={4} value={form.observations} onChange={(event) => onChange((current) => ({ ...current, observations: event.target.value }))} />
      </label>
    </>
  );
}
