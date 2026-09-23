"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "@/components/providers/session-provider";
import { SmartLookup, type SmartLookupOption } from "@/components/ui/smart-lookup";

type ServiceOrderRecord = {
  id: string;
  branchId?: string;
  customerId?: string;
  orderNo: string;
  openedAt: string;
  promisedDeliveryDate: string;
  deliveryType: "Standard" | "Priority" | "Express";
  operationalPriority: string | null;
  status: string;
  totalValue: string | null;
  paymentTermsDays?: number;
  commercialNotes?: string | null;
  customerNotes?: string | null;
};

type ServiceOrderDetail = {
  serviceOrder: ServiceOrderRecord & {
    branchId: string;
    customerId: string;
    paymentTermsDays: number;
    commercialNotes: string | null;
    customerNotes: string | null;
  };
  customer: {
    legalName: string;
    phone: string | null;
    email: string | null;
  };
  items: Array<{
    id: string;
    itemNo: number;
    itemType: string;
    description: string;
    quantity: string;
    unitPrice: string | null;
    discountValue: string | null;
    status: string;
  }>;
};

type CustomerLookupRecord = {
  id: string;
  legalName: string;
  tradeName: string | null;
  email: string | null;
  cpfCnpj: string | null;
};

type CreateServiceOrderResponse = {
  serviceOrder: ServiceOrderRecord & {
    branchId: string;
    customerId: string;
    paymentTermsDays: number;
    commercialNotes: string | null;
    customerNotes: string | null;
  };
  items: Array<{
    id: string;
  }>;
};

type ServiceOrderForm = {
  branchId: string;
  customerId: string;
  deliveryType: "Standard" | "Priority" | "Express";
  operationalPriority: string;
  paymentTermsDays: string;
  commercialNotes: string;
  customerNotes: string;
  itemType: string;
  itemDescription: string;
  itemQuantity: string;
  itemUnitPrice: string;
  itemDiscountValue: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createEmptyForm(branchId: string | null | undefined): ServiceOrderForm {
  return {
    branchId: branchId ?? "",
    customerId: "",
    deliveryType: "Standard",
    operationalPriority: "",
    paymentTermsDays: "0",
    commercialNotes: "",
    customerNotes: "",
    itemType: "",
    itemDescription: "",
    itemQuantity: "1",
    itemUnitPrice: "",
    itemDiscountValue: "",
  };
}

function mapDetailsToForm(details: ServiceOrderDetail): ServiceOrderForm {
  return {
    branchId: details.serviceOrder.branchId,
    customerId: details.serviceOrder.customerId,
    deliveryType: details.serviceOrder.deliveryType,
    operationalPriority: details.serviceOrder.operationalPriority ?? "",
    paymentTermsDays: String(details.serviceOrder.paymentTermsDays ?? 0),
    commercialNotes: details.serviceOrder.commercialNotes ?? "",
    customerNotes: details.serviceOrder.customerNotes ?? "",
    itemType: details.items[0]?.itemType ?? "",
    itemDescription: details.items[0]?.description ?? "",
    itemQuantity: details.items[0]?.quantity ?? "1",
    itemUnitPrice: details.items[0]?.unitPrice ?? "",
    itemDiscountValue: details.items[0]?.discountValue ?? "",
  };
}

function formatWorkspaceMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const technicalHints = ["ECONN", "column ", "violates", "syntax error", "should not exist"];
  if (technicalHints.some((hint) => error.message.includes(hint))) {
    return fallback;
  }

  return error.message;
}

export function ServiceOrdersWorkspace() {
  const { session, hasAnyPermission, apiJson } = useSession();
  const canRead = hasAnyPermission("service_orders.read");
  const canWrite = hasAnyPermission("service_orders.write");
  const canReadCustomers = hasAnyPermission("customers.read");
  const [orders, setOrders] = useState<ServiceOrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerLookupRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [details, setDetails] = useState<ServiceOrderDetail | null>(null);
  const [form, setForm] = useState<ServiceOrderForm>(createEmptyForm(session?.activeBranchId));

  const filteredOrders = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (!normalized) return true;
      return [order.orderNo, order.deliveryType, order.operationalPriority ?? "", order.status].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [orders, searchQuery, statusFilter]);

  const branchOptions = useMemo(
    () =>
      (session?.branches ?? []).map((branch) => ({
        id: branch.id,
        label: branch.label,
        hint: branch.hint,
      })),
    [session?.branches],
  );

  const selectedOrder = details?.serviceOrder ?? null;
  const canEditSelectedOrder = canWrite && selectedOrder?.status !== "cancelled";

  const customerLookupOptions = useMemo<SmartLookupOption[]>(() => {
    const options = customers.map((customer) => ({
      id: customer.id,
      label: customer.legalName,
      hint: customer.tradeName ?? customer.email ?? customer.cpfCnpj ?? undefined,
    }));

    if (details?.serviceOrder.customerId && !options.some((option) => option.id === details.serviceOrder.customerId)) {
      options.unshift({
        id: details.serviceOrder.customerId,
        label: details.customer.legalName,
        hint: details.customer.email ?? details.customer.phone ?? undefined,
      });
    }

    return options;
  }, [customers, details]);

  const loadDetails = useCallback(
    async (serviceOrderId: string) => {
      setDetailLoading(true);
      try {
        const response = await apiJson<ServiceOrderDetail>(`/service-orders/${serviceOrderId}`);
        setDetails(response);
        setMessage(null);
      } catch (error) {
        setMessage(
          formatWorkspaceMessage(error, "The Service Order details could not be loaded. Review your access and try again."),
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [apiJson],
  );

  const loadOrders = useCallback(
    async (preferredActiveId?: string | null) => {
      if (!canRead) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const suffix = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
        const response = await apiJson<ServiceOrderRecord[]>(`/service-orders${suffix}`);
        setOrders(response);
        const nextActiveId =
          preferredActiveId !== undefined
            ? preferredActiveId
            : activeOrderId && response.some((order) => order.id === activeOrderId)
              ? activeOrderId
              : response[0]?.id ?? null;
        setActiveOrderId(nextActiveId);
        if (nextActiveId) {
          void loadDetails(nextActiveId);
        } else {
          setDetails(null);
        }
        setMessage(null);
      } catch (error) {
        setOrders([]);
        setActiveOrderId(null);
        setDetails(null);
        setMessage(
          formatWorkspaceMessage(error, "Service Orders could not be loaded. Review filters, access, and branch context."),
        );
      } finally {
        setLoading(false);
      }
    },
    [activeOrderId, apiJson, canRead, loadDetails, searchQuery],
  );

  const loadCustomers = useCallback(async () => {
    if (!canWrite || !canReadCustomers) {
      setCustomers([]);
      return;
    }
    setLoadingCustomers(true);
    try {
      const response = await apiJson<CustomerLookupRecord[]>("/customers");
      setCustomers(response);
    } catch (error) {
      setCustomers([]);
      setMessage(
        formatWorkspaceMessage(
          error,
          "Customer lookup could not be loaded. Review access to Customers before creating a Service Order.",
        ),
      );
    } finally {
      setLoadingCustomers(false);
    }
  }, [apiJson, canReadCustomers, canWrite]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadOrders]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCustomers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCustomers]);

  useEffect(() => {
    if (details && !showCreateForm) {
      setForm(mapDetailsToForm(details));
    }
  }, [details, showCreateForm]);

  function openCreateForm() {
    setShowCreateForm(true);
    setActiveOrderId(null);
    setDetails(null);
    setForm(createEmptyForm(session?.activeBranchId));
    setMessage(null);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;

    if (!form.branchId || !form.customerId) {
      setMessage("Select branch and customer before saving the Service Order.");
      return;
    }
    if (!form.itemType.trim() || !form.itemDescription.trim()) {
      setMessage("Inform the first item type and description before saving the Service Order.");
      return;
    }

    const quantity = Number(form.itemQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Item quantity must be greater than zero.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<CreateServiceOrderResponse>("/service-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: form.branchId,
          customerId: form.customerId,
          deliveryType: form.deliveryType,
          operationalPriority: form.operationalPriority || undefined,
          paymentTermsDays: Number(form.paymentTermsDays || 0),
          commercialNotes: form.commercialNotes || undefined,
          customerNotes: form.customerNotes || undefined,
          items: [
            {
              itemType: form.itemType,
              description: form.itemDescription,
              quantity,
              unitPrice: parseOptionalNumber(form.itemUnitPrice),
              discountValue: parseOptionalNumber(form.itemDiscountValue),
            },
          ],
        }),
      });
      const createdId = created.serviceOrder.id;
      setShowCreateForm(false);
      setActiveOrderId(createdId);
      setMessage("Service Order saved successfully. The new record is already selected and ready for update.");
      await loadOrders(createdId);
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "The Service Order could not be saved. Review customer, branch, and first-item information, then try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder || !canEditSelectedOrder) return;
    if (!form.customerId) {
      setMessage("Select a customer before updating the Service Order.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await apiJson<ServiceOrderRecord>(`/service-orders/${selectedOrder.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          customerId: form.customerId,
          deliveryType: form.deliveryType,
          operationalPriority: form.operationalPriority || undefined,
          paymentTermsDays: Number(form.paymentTermsDays || 0),
          commercialNotes: form.commercialNotes || null,
          customerNotes: form.customerNotes || null,
        }),
      });
      setMessage("Service Order updated successfully. The grid and form stayed synchronized on the current screen.");
      await loadOrders(selectedOrder.id);
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "The Service Order could not be updated. Review the form data and try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <section className="mini-card">
        <h3>Service Orders indisponíveis</h3>
        <p>Você não possui acesso à área operacional de Service Orders no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Operações</div>
        <h1 className="title">Service Orders</h1>
        <p>Gerencie Service Orders no padrão obrigatório ANEXSYS com filtro, grade e formulário no mesmo fluxo operacional.</p>
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
              <h3>Operational grid</h3>
              <p>{loading ? "Loading…" : `${filteredOrders.length} Service Order(s) visible`}</p>
            </div>
            {canWrite ? (
              <button className="button" onClick={openCreateForm} type="button">
                New Service Order
              </button>
            ) : null}
          </div>

          <div className="filters-grid">
            <label className="field">
              <span>Search</span>
              <input
                placeholder="Number, status or priority"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service Order</th>
                  <th>Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={order.id === activeOrderId ? "data-table__row--active" : undefined}
                    onClick={() => {
                      setShowCreateForm(false);
                      setActiveOrderId(order.id);
                      void loadDetails(order.id);
                    }}
                  >
                    <td>
                      <strong>{order.orderNo}</strong>
                      <div className="table-subtle">
                        {order.deliveryType}
                        {order.operationalPriority ? ` · ${order.operationalPriority}` : ""}
                      </div>
                    </td>
                    <td>{formatDate(order.promisedDeliveryDate)}</td>
                    <td>
                      <span className={`status-chip status-chip--${order.status === "cancelled" ? "inactive" : "active"}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
                {!loading && filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">No Service Orders found for the current filters.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="mini-card">
          <div className="workspace-toolbar__copy">
            <h3>{showCreateForm ? "Create Service Order" : selectedOrder ? "View / Edit Service Order" : "Service Order form"}</h3>
            <p>
              {showCreateForm
                ? "Create the Service Order and keep the grid synchronized without leaving the current screen."
                : selectedOrder
                  ? "Review, update and keep the selected Service Order aligned with the operational grid."
                  : "Select a Service Order in the grid or start a new one."}
            </p>
          </div>

          {detailLoading && !showCreateForm ? <div className="empty-state">Loading Service Order details…</div> : null}

          {showCreateForm || selectedOrder ? (
            <form className="form-grid" onSubmit={showCreateForm ? handleCreate : handleUpdate}>
              <label className="field">
                <span>Branch</span>
                <select
                  disabled={!showCreateForm || saving}
                  required
                  value={form.branchId}
                  onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}
                >
                  <option value="">Select branch</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field">
                <SmartLookup
                  allowClear={false}
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder) || !canReadCustomers}
                  emptyMessage={
                    loadingCustomers
                      ? "Loading customers…"
                      : canReadCustomers
                        ? "No customers available."
                        : "Customer lookup depends on Customers read permission."
                  }
                  entityType="customers"
                  label="Customer"
                  onChange={(option) => setForm((current) => ({ ...current, customerId: option?.id ?? "" }))}
                  options={customerLookupOptions}
                  searchPlaceholder="Search and select customer"
                  value={form.customerId}
                />
              </div>

              <label className="field">
                <span>Delivery type</span>
                <select
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  value={form.deliveryType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryType: event.target.value as ServiceOrderForm["deliveryType"],
                    }))
                  }
                >
                  <option value="Standard">Standard</option>
                  <option value="Priority">Priority</option>
                  <option value="Express">Express</option>
                </select>
              </label>

              <label className="field">
                <span>Operational priority</span>
                <input
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  placeholder="Optional operational priority"
                  value={form.operationalPriority}
                  onChange={(event) => setForm((current) => ({ ...current, operationalPriority: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Payment terms (days)</span>
                <input
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  inputMode="numeric"
                  value={form.paymentTermsDays}
                  onChange={(event) => setForm((current) => ({ ...current, paymentTermsDays: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Commercial notes</span>
                <textarea
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  rows={3}
                  value={form.commercialNotes}
                  onChange={(event) => setForm((current) => ({ ...current, commercialNotes: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Customer notes</span>
                <textarea
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  rows={3}
                  value={form.customerNotes}
                  onChange={(event) => setForm((current) => ({ ...current, customerNotes: event.target.value }))}
                />
              </label>

              {showCreateForm ? (
                <>
                  <div className="workspace-toolbar__copy">
                    <h4>First item</h4>
                    <p>The first item is mandatory for Service Order creation.</p>
                  </div>

                  <label className="field">
                    <span>Item type</span>
                    <input
                      required
                      disabled={saving}
                      value={form.itemType}
                      onChange={(event) => setForm((current) => ({ ...current, itemType: event.target.value }))}
                    />
                  </label>

                  <label className="field">
                    <span>Item description</span>
                    <input
                      required
                      disabled={saving}
                      value={form.itemDescription}
                      onChange={(event) => setForm((current) => ({ ...current, itemDescription: event.target.value }))}
                    />
                  </label>

                  <label className="field">
                    <span>Quantity</span>
                    <input
                      disabled={saving}
                      inputMode="decimal"
                      required
                      value={form.itemQuantity}
                      onChange={(event) => setForm((current) => ({ ...current, itemQuantity: event.target.value }))}
                    />
                  </label>

                  <label className="field">
                    <span>Unit price</span>
                    <input
                      disabled={saving}
                      inputMode="decimal"
                      value={form.itemUnitPrice}
                      onChange={(event) => setForm((current) => ({ ...current, itemUnitPrice: event.target.value }))}
                    />
                  </label>

                  <label className="field">
                    <span>Item discount</span>
                    <input
                      disabled={saving}
                      inputMode="decimal"
                      value={form.itemDiscountValue}
                      onChange={(event) => setForm((current) => ({ ...current, itemDiscountValue: event.target.value }))}
                    />
                  </label>
                </>
              ) : null}

              {!showCreateForm && details ? (
                <>
                  <div className="detail-grid">
                    <div className="detail-field">
                      <span>Order number</span>
                      <strong>{details.serviceOrder.orderNo}</strong>
                    </div>
                    <div className="detail-field">
                      <span>Promised delivery</span>
                      <strong>{formatDate(details.serviceOrder.promisedDeliveryDate)}</strong>
                    </div>
                    <div className="detail-field">
                      <span>Status</span>
                      <strong>{details.serviceOrder.status}</strong>
                    </div>
                    <div className="detail-field">
                      <span>Total</span>
                      <strong>{details.serviceOrder.totalValue ?? "—"}</strong>
                    </div>
                  </div>

                  <div className="mini-section">
                    <h4>Items</h4>
                    <ul className="placeholder-list">
                      {details.items.map((item) => (
                        <li key={item.id}>
                          <strong>#{item.itemNo}</strong> · {item.itemType} · {item.description} · {item.quantity}
                          {item.unitPrice ? ` · ${item.unitPrice}` : ""} · {item.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              <div className="button-row">
                {showCreateForm ? (
                  <>
                    <button className="button" disabled={saving} type="submit">
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setShowCreateForm(false);
                        if (selectedOrder) {
                          setForm(mapDetailsToForm(details!));
                        }
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : selectedOrder ? (
                  <button className="button" disabled={saving || !canEditSelectedOrder} type="submit">
                    {saving ? "Updating…" : "Update"}
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="empty-state">Use the grid to select a Service Order or click New Service Order to begin.</div>
          )}
        </article>
      </section>
    </>
  );
}
