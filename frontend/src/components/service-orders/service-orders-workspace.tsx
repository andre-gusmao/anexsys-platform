"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import { useSession } from "@/components/providers/session-provider";
import { SmartLookup, type SmartLookupOption } from "@/components/ui/smart-lookup";
import {
  addServiceOrderItemGridRow,
  buildCreateServiceOrderItemsPayload,
  buildServiceOrderItemMutationPlan,
  createEmptyServiceOrderItemGridRow,
  getVisibleServiceOrderItemGridRows,
  mapServiceOrderItemsToGridRows,
  removeServiceOrderItemGridRow,
  updateServiceOrderItemGridRow,
  type PersistedServiceOrderItem,
  type ServiceOrderItemGridRow,
} from "@/components/service-orders/service-order-workspace-view-model";

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
  items: PersistedServiceOrderItem[];
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

type ServiceOrderHeaderForm = {
  customerId: string;
  deliveryType: "Standard" | "Priority" | "Express";
  operationalPriority: string;
  commercialNotes: string;
  customerNotes: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function createEmptyHeaderForm(): ServiceOrderHeaderForm {
  return {
    customerId: "",
    deliveryType: "Standard",
    operationalPriority: "",
    commercialNotes: "",
    customerNotes: "",
  };
}

function mapDetailsToHeaderForm(details: ServiceOrderDetail): ServiceOrderHeaderForm {
  return {
    customerId: details.serviceOrder.customerId,
    deliveryType: details.serviceOrder.deliveryType,
    operationalPriority: details.serviceOrder.operationalPriority ?? "",
    commercialNotes: details.serviceOrder.commercialNotes ?? "",
    customerNotes: details.serviceOrder.customerNotes ?? "",
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
  const searchParams = useSearchParams();
  const { session, hasAnyPermission, apiJson } = useSession();
  const { isMobile } = useWorkspaceViewportMode();
  const focusServiceOrderId = searchParams.get("focusServiceOrderId");
  const workspaceMode = searchParams.get("workspaceMode");
  const canRead = hasAnyPermission("service_orders.read");
  const canWrite = hasAnyPermission("service_orders.write");
  const canReadCustomers = hasAnyPermission("customers.read");
  const [orders, setOrders] = useState<ServiceOrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerLookupRecord[]>([]);
  const [searchQuery, setSearchQuery] = useWorkspaceScopedState("service-orders.searchQuery", "");
  const [statusFilter, setStatusFilter] = useWorkspaceScopedState("service-orders.statusFilter", "");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useWorkspaceScopedState<string | null>("service-orders.activeOrderId", null);
  const [showCreateForm, setShowCreateForm] = useWorkspaceScopedState("service-orders.showCreateForm", false);
  const [details, setDetails] = useState<ServiceOrderDetail | null>(null);
  const [headerForm, setHeaderForm] = useWorkspaceScopedState<ServiceOrderHeaderForm>("service-orders.headerForm", createEmptyHeaderForm());
  const [itemRows, setItemRows] = useWorkspaceScopedState<ServiceOrderItemGridRow[]>("service-orders.itemRows", [createEmptyServiceOrderItemGridRow(1)]);
  const latestDetailRequestId = useRef(0);

  const activeCompany = session?.companies.find((company) => company.tenantId === session?.tenantId) ?? null;
  const activeBranch = session?.branches.find((branch) => branch.id === session?.activeBranchId) ?? null;
  const canPersistInContext = Boolean(session?.tenantId && session?.activeBranchId);

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

  const selectedOrder = details?.serviceOrder ?? null;
  const selectedCustomerId = headerForm.customerId || selectedOrder?.customerId || null;
  const { navigateWithinWorkspace, openWorkspaceInBrowserTab, openWorkspaceInBrowserWindow, openWorkspaceInNewTab } = useWorkspaceRegistration({
    label: showCreateForm ? "OS: New" : selectedOrder ? `OS #${selectedOrder.orderNo}` : "Service Orders",
    subtitle: showCreateForm ? "Novo cadastro" : selectedOrder?.deliveryType ?? null,
  });
  const canEditSelectedOrder = canWrite && selectedOrder !== null && selectedOrder.status !== "cancelled";
  const visibleItemRows = useMemo(() => getVisibleServiceOrderItemGridRows(itemRows), [itemRows]);

  const openRelatedCustomerWorkspace = useCallback(
    (focusSection?: "measurements") => {
      if (!selectedCustomerId) {
        return;
      }

      const params = new URLSearchParams();
      params.set("focusCustomerId", selectedCustomerId);
      if (focusSection) {
        params.set("focusSection", focusSection);
      }

      const targetPath = `/customers?${params.toString()}`;
      if (isMobile) {
        navigateWithinWorkspace(targetPath);
        return;
      }

      openWorkspaceInNewTab(targetPath, focusSection === "measurements" ? "Measurements" : "Customer", {
        cloneCurrent: false,
      });
    },
    [isMobile, navigateWithinWorkspace, openWorkspaceInNewTab, selectedCustomerId],
  );

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
      const requestId = latestDetailRequestId.current + 1;
      latestDetailRequestId.current = requestId;
      setDetailLoading(true);
      try {
        const response = await apiJson<ServiceOrderDetail>(`/service-orders/${serviceOrderId}`);
        if (latestDetailRequestId.current !== requestId) {
          return;
        }
        setDetails(response);
        if (!showCreateForm) {
          setHeaderForm(mapDetailsToHeaderForm(response));
          setItemRows(mapServiceOrderItemsToGridRows(response.items));
        }
        if (focusServiceOrderId !== serviceOrderId || workspaceMode === "new") {
          navigateWithinWorkspace(`/service-orders?focusServiceOrderId=${encodeURIComponent(serviceOrderId)}`);
        }
        setMessage(null);
      } catch (error) {
        if (latestDetailRequestId.current !== requestId) {
          return;
        }
        setMessage(
          formatWorkspaceMessage(error, "The Service Order details could not be loaded. Review your access and try again."),
        );
      } finally {
        if (latestDetailRequestId.current === requestId) {
          setDetailLoading(false);
        }
      }
    },
    [apiJson, focusServiceOrderId, navigateWithinWorkspace, setHeaderForm, setItemRows, showCreateForm, workspaceMode],
  );

  const loadOrders = useCallback(
    async (preferredActiveId?: string | null) => {
      if (!canRead) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await apiJson<ServiceOrderRecord[]>("/service-orders");
        setOrders(response);
        const nextActiveId =
          preferredActiveId !== undefined
            ? preferredActiveId
            : activeOrderId && response.some((order) => order.id === activeOrderId)
              ? activeOrderId
              : null;
        setActiveOrderId(nextActiveId);
        if (nextActiveId) {
          await loadDetails(nextActiveId);
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
    [activeOrderId, apiJson, canRead, loadDetails, setActiveOrderId],
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
  }, [loadOrders, session?.activeBranchId, session?.tenantId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCustomers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCustomers, session?.tenantId]);

  useEffect(() => {
    if (!focusServiceOrderId || focusServiceOrderId === activeOrderId || showCreateForm) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveOrderId(focusServiceOrderId);
      void loadDetails(focusServiceOrderId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeOrderId, focusServiceOrderId, loadDetails, setActiveOrderId, showCreateForm]);

  useEffect(() => {
    if (!activeOrderId || showCreateForm || selectedOrder?.id === activeOrderId || focusServiceOrderId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadDetails(activeOrderId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeOrderId, focusServiceOrderId, loadDetails, selectedOrder?.id, showCreateForm]);

  const openCreateForm = useCallback(() => {
    setShowCreateForm(true);
    setDetails(null);
    setActiveOrderId(null);
    setHeaderForm(createEmptyHeaderForm());
    setItemRows([createEmptyServiceOrderItemGridRow(1)]);
    setMessage(null);
  }, [setActiveOrderId, setHeaderForm, setItemRows, setShowCreateForm]);

  const openCreateWorkspace = useCallback(() => {
    const targetPath = "/service-orders?workspaceMode=new";
    if (isMobile) {
      navigateWithinWorkspace(targetPath);
      return;
    }

    openWorkspaceInNewTab(targetPath, "OS: New", { cloneCurrent: false, subtitle: "Novo cadastro" });
  }, [isMobile, navigateWithinWorkspace, openWorkspaceInNewTab]);

  useEffect(() => {
    if (workspaceMode !== "new") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      openCreateForm();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [openCreateForm, workspaceMode]);

  function restoreSelectedOrderForm() {
    setShowCreateForm(false);
    if (workspaceMode === "new") {
      navigateWithinWorkspace("/service-orders");
    }
    if (details) {
      setHeaderForm(mapDetailsToHeaderForm(details));
      setItemRows(mapServiceOrderItemsToGridRows(details.items));
    } else {
      setHeaderForm(createEmptyHeaderForm());
      setItemRows([createEmptyServiceOrderItemGridRow(1)]);
    }
  }

  function validateItems(requireAtLeastOneItem: boolean) {
    if (requireAtLeastOneItem && visibleItemRows.length === 0) {
      return "Add at least one item before saving the Service Order.";
    }

    for (const row of visibleItemRows) {
      if (!row.itemType.trim() || !row.description.trim()) {
        return "Each item must include Product and Service / Notes before saving.";
      }
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return "Each item quantity must be greater than zero.";
      }
    }

    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;

    if (!canPersistInContext || !session?.activeBranchId) {
      setMessage("Select the active Branch in the header before saving the Service Order.");
      return;
    }
    if (!headerForm.customerId) {
      setMessage("Select the customer before saving the Service Order.");
      return;
    }

    const itemValidation = validateItems(true);
    if (itemValidation) {
      setMessage(itemValidation);
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<CreateServiceOrderResponse>("/service-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: session.activeBranchId,
          customerId: headerForm.customerId,
          deliveryType: headerForm.deliveryType,
          operationalPriority: headerForm.operationalPriority || undefined,
          commercialNotes: headerForm.commercialNotes || undefined,
          customerNotes: headerForm.customerNotes || undefined,
          items: buildCreateServiceOrderItemsPayload(itemRows),
        }),
      });
      const createdId = created.serviceOrder.id;
      setShowCreateForm(false);
      setActiveOrderId(createdId);
      await loadOrders(createdId);
      navigateWithinWorkspace(`/service-orders?focusServiceOrderId=${encodeURIComponent(createdId)}`);
      setMessage("Service Order saved. The header and item grid were persisted, the grid was refreshed, and the new record is already selected.");
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "The Service Order could not be saved. Review the active context, customer, and item grid, then try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder || !canEditSelectedOrder) return;

    if (!headerForm.customerId) {
      setMessage("Select the customer before updating the Service Order.");
      return;
    }

    const itemValidation = validateItems(false);
    if (itemValidation) {
      setMessage(itemValidation);
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await apiJson<ServiceOrderRecord>(`/service-orders/${selectedOrder.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          customerId: headerForm.customerId,
          deliveryType: headerForm.deliveryType,
          operationalPriority: headerForm.operationalPriority || undefined,
          commercialNotes: headerForm.commercialNotes || null,
          customerNotes: headerForm.customerNotes || null,
        }),
      });

      const plan = buildServiceOrderItemMutationPlan(itemRows, details?.items ?? []);

      for (const item of plan.update) {
        await apiJson(`/service-orders/${selectedOrder.id}/items/${item.itemId}`, {
          method: "PATCH",
          body: JSON.stringify({
            itemType: item.itemType,
            description: item.description,
            quantity: item.quantity,
          }),
        });
      }

      for (const item of plan.remove) {
        await apiJson(`/service-orders/${selectedOrder.id}/items/${item.itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: item.status }),
        });
      }

      for (const item of plan.create) {
        await apiJson(`/service-orders/${selectedOrder.id}/items`, {
          method: "POST",
          body: JSON.stringify(item),
        });
      }

      await loadOrders(selectedOrder.id);
      setMessage(
        `Service Order updated. Header synchronized and item grid applied with ${plan.create.length} addition(s), ${plan.update.length} edit(s), and ${plan.remove.length} removal(s).`,
      );
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "The Service Order could not be updated. Review the header data and item grid, then try again.",
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
        <p>Estrutura operacional com contexto herdado de Company/Branch, Order Header e editable Items Grid no mesmo fluxo ANEXSYS.</p>
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
              <button className="button" onClick={openCreateWorkspace} type="button">
                New Service Order
              </button>
            ) : null}
          </div>

          <div className="filters-grid">
            <label className="field">
              <span>Search</span>
              <input placeholder="Number, status or priority" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
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
                    className={order.id === activeOrderId && !showCreateForm ? "data-table__row--active" : undefined}
                    onClick={() => {
                      setShowCreateForm(false);
                      setActiveOrderId(order.id);
                      navigateWithinWorkspace(`/service-orders?focusServiceOrderId=${encodeURIComponent(order.id)}`);
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
          <div className="workspace-toolbar">
            <div className="workspace-toolbar__copy">
              <h3>{showCreateForm ? "Create Service Order" : selectedOrder ? "Service Order Header + Items Grid" : "Service Order form"}</h3>
              <p>
                {showCreateForm
                  ? "Company and Branch are inherited automatically from the active header context while you build the order header and items grid."
                  : selectedOrder
                    ? "Review the order header and keep multiple items editable without leaving the selected Service Order."
                    : "Select a Service Order in the grid or start a new one."}
              </p>
            </div>
            {!showCreateForm && selectedOrder && canWrite ? (
              <button className="button-secondary" onClick={openCreateWorkspace} type="button">
                New Service Order
              </button>
            ) : null}
          </div>

          {detailLoading && !showCreateForm ? <div className="empty-state">Loading Service Order details…</div> : null}

          {showCreateForm || selectedOrder ? (
            <form className="form-grid" onSubmit={showCreateForm ? handleCreate : handleUpdate}>
              <div className="mini-section">
                <h4>Order Header</h4>
                <div className="detail-grid">
                  <div className="detail-field">
                    <span>Company</span>
                    <strong>{activeCompany?.displayName ?? "Select Company in the header"}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Branch</span>
                    <strong>{activeBranch?.label ?? "Select Branch in the header"}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Order Number</span>
                    <strong>{selectedOrder?.orderNo ?? "Generated after Save"}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Status</span>
                    <strong>{selectedOrder?.status ?? "draft"}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Opened At</span>
                    <strong>{selectedOrder ? formatDate(selectedOrder.openedAt) : "Generated after Save"}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Promised Delivery</span>
                    <strong>{selectedOrder ? formatDate(selectedOrder.promisedDeliveryDate) : "Calculated after Save"}</strong>
                  </div>
                </div>
              </div>

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
                  onChange={(option) => setHeaderForm((current) => ({ ...current, customerId: option?.id ?? "" }))}
                  options={customerLookupOptions}
                  searchPlaceholder="Search and select customer"
                  value={headerForm.customerId}
                />
                <div className="button-row">
                  <button
                    className="button-secondary"
                    disabled={!selectedCustomerId}
                    onClick={() => openRelatedCustomerWorkspace()}
                    type="button"
                  >
                    Abrir Customer
                  </button>
                  <button
                    className="button-secondary"
                    disabled={!selectedCustomerId}
                    onClick={() => openRelatedCustomerWorkspace("measurements")}
                    type="button"
                  >
                    Abrir Measurements
                  </button>
                  {!isMobile && selectedCustomerId ? (
                    <>
                      <button
                        className="button-secondary"
                        onClick={() =>
                          openWorkspaceInBrowserTab(`/customers?focusCustomerId=${encodeURIComponent(selectedCustomerId)}`, "Customer", {
                            cloneCurrent: false,
                          })
                        }
                        type="button"
                      >
                        Customer em nova aba
                      </button>
                      <button
                        className="button-secondary"
                        onClick={() =>
                          openWorkspaceInBrowserWindow(`/customers?focusCustomerId=${encodeURIComponent(selectedCustomerId)}`, "Customer", {
                            cloneCurrent: false,
                          })
                        }
                        type="button"
                      >
                        Customer em nova janela
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <label className="field">
                <span>Delivery type</span>
                <select
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  value={headerForm.deliveryType}
                  onChange={(event) =>
                    setHeaderForm((current) => ({
                      ...current,
                      deliveryType: event.target.value as ServiceOrderHeaderForm["deliveryType"],
                    }))
                  }
                >
                  <option value="Standard">Standard</option>
                  <option value="Priority">Priority</option>
                  <option value="Express">Express</option>
                </select>
              </label>

              <label className="field">
                <span>Operational information</span>
                <input
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  placeholder="Operational priority or short execution context"
                  value={headerForm.operationalPriority}
                  onChange={(event) => setHeaderForm((current) => ({ ...current, operationalPriority: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Commercial notes</span>
                <textarea
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  rows={3}
                  value={headerForm.commercialNotes}
                  onChange={(event) => setHeaderForm((current) => ({ ...current, commercialNotes: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Customer notes</span>
                <textarea
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  rows={3}
                  value={headerForm.customerNotes}
                  onChange={(event) => setHeaderForm((current) => ({ ...current, customerNotes: event.target.value }))}
                />
              </label>

              <div className="mini-section">
                <div className="workspace-toolbar">
                  <div className="workspace-toolbar__copy">
                    <h4>Items Grid</h4>
                    <p>Add, edit, and remove multiple items while staying inside the same Service Order.</p>
                  </div>
                  {(showCreateForm || canEditSelectedOrder) ? (
                    <button
                      className="button-secondary"
                      disabled={saving}
                      onClick={() => setItemRows((current) => addServiceOrderItemGridRow(current))}
                      type="button"
                    >
                      Add Item
                    </button>
                  ) : null}
                </div>

                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Product</th>
                        <th>Service / Notes</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItemRows.map((row) => {
                        const editable = saving ? false : showCreateForm || row.isEditing;
                        const canMutateRow = showCreateForm || canEditSelectedOrder;
                        return (
                          <tr key={row.localId}>
                            <td>#{row.itemNo}</td>
                            <td>
                              <input
                                disabled={!editable}
                                placeholder="Jeans, Dress, Shirt"
                                value={row.itemType}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { itemType: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                disabled={!editable}
                                placeholder="Original Hem, Hem 58 cm, Left cuff only"
                                value={row.description}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { description: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                disabled={!editable}
                                inputMode="decimal"
                                min="0.0001"
                                step="0.0001"
                                type="number"
                                value={row.quantity}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { quantity: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <span className={`status-chip status-chip--${row.isNew ? "active" : row.status === "cancelled" ? "inactive" : "active"}`}>
                                {row.isNew ? "new" : row.status}
                              </span>
                            </td>
                            <td>
                              <div className="button-row">
                                {canMutateRow ? (
                                  <button
                                    className="button-ghost"
                                    disabled={saving}
                                    onClick={() =>
                                      setItemRows((current) =>
                                        updateServiceOrderItemGridRow(current, row.localId, { isEditing: !row.isEditing }),
                                      )
                                    }
                                    type="button"
                                  >
                                    {showCreateForm || row.isEditing ? "Finish Edit" : "Edit Item"}
                                  </button>
                                ) : null}
                                {canMutateRow ? (
                                  <button
                                    className="button-ghost"
                                    disabled={saving}
                                    onClick={() => setItemRows((current) => removeServiceOrderItemGridRow(current, row.localId))}
                                    type="button"
                                  >
                                    Remove Item
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {visibleItemRows.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <div className="empty-state">No active items in the grid. Use Add Item to continue.</div>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="button-row">
                {showCreateForm ? (
                  <>
                    <button className="button" disabled={saving || !canWrite} type="submit">
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button className="button-secondary" onClick={restoreSelectedOrderForm} type="button">
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
            <div className="empty-state">Use the grid to select a Service Order or click New Service Order to start a new header with an editable items grid.</div>
          )}
        </article>
      </section>
    </>
  );
}
