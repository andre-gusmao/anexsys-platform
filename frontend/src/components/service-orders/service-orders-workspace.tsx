"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useWorkspaceManager, useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useWorkspaceSearchParams } from "@/components/app-shell/workspace-pane";
import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import { useSession } from "@/components/providers/session-provider";
import { CadastroListPanel } from "@/components/ui/cadastro-list-panel";
import { WorkspaceFlash } from "@/components/ui/workspace-flash";
import { SmartLookup, type SmartLookupOption } from "@/components/ui/smart-lookup";
import { applyOsListFilters, buildOsExcelCsv, osDeliveryTypeLabel, osStatusLabel } from "@/components/service-orders/os-list";
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
  promisedDeliveryTime?: string | null;
  deliveryType: "Standard" | "Priority" | "Express";
  operationalPriority: string | null;
  status: string;
  totalValue: string | null;
  paymentTermsDays?: number;
  commercialNotes?: string | null;
  customerNotes?: string | null;
  commercialResponsibleActorId?: string;
};

type ActorSummary = {
  id: string;
  displayName: string;
  email?: string | null;
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
  commercialResponsible?: ActorSummary | null;
  productionTechnician?: ActorSummary | null;
  qualityReviewer?: ActorSummary | null;
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
  promisedDeliveryDate: string;
  promisedDeliveryTime: string;
  attendantId: string;
  commercialNotes: string;
  customerNotes: string;
};

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function toTimeInput(value: string | null | undefined, fromDate?: string | null) {
  if (value && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  if (!fromDate) return "";
  const date = new Date(fromDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function nowDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`;
}

function nowTimeInput() {
  const now = new Date();
  return `${padDatePart(now.getHours())}:${padDatePart(now.getMinutes())}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function createEmptyHeaderForm(attendantId = ""): ServiceOrderHeaderForm {
  return {
    customerId: "",
    deliveryType: "Standard",
    operationalPriority: "",
    promisedDeliveryDate: "",
    promisedDeliveryTime: "",
    attendantId,
    commercialNotes: "",
    customerNotes: "",
  };
}

function mapDetailsToHeaderForm(details: ServiceOrderDetail): ServiceOrderHeaderForm {
  return {
    customerId: details.serviceOrder.customerId,
    deliveryType: details.serviceOrder.deliveryType,
    operationalPriority: details.serviceOrder.operationalPriority ?? "",
    promisedDeliveryDate: toDateInput(details.serviceOrder.promisedDeliveryDate),
    promisedDeliveryTime: toTimeInput(details.serviceOrder.promisedDeliveryTime, details.serviceOrder.openedAt),
    attendantId: details.serviceOrder.commercialResponsibleActorId ?? details.commercialResponsible?.id ?? "",
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
  const searchParams = useWorkspaceSearchParams();
  const { session, hasAnyPermission, apiJson } = useSession();
  const { isMobile } = useWorkspaceViewportMode();
  const focusServiceOrderId = searchParams.get("focusServiceOrderId");
  const workspaceMode = searchParams.get("workspaceMode");
  const canRead = hasAnyPermission("service_orders.read");
  const canWrite = hasAnyPermission("service_orders.write");
  const canReadCustomers = hasAnyPermission("customers.read");
  const canWriteCustomers = hasAnyPermission("customers.write");
  const canReadUsers = hasAnyPermission("users.read");
  const [orders, setOrders] = useState<ServiceOrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerLookupRecord[]>([]);
  const [users, setUsers] = useState<ActorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useWorkspaceScopedState<string | null>("service-orders.activeOrderId", null);
  const [showCreateForm, setShowCreateForm] = useWorkspaceScopedState("service-orders.showCreateForm", false);
  const [details, setDetails] = useState<ServiceOrderDetail | null>(null);
  const [headerForm, setHeaderForm] = useWorkspaceScopedState<ServiceOrderHeaderForm>(
    "service-orders.headerForm",
    createEmptyHeaderForm(),
  );
  const [itemRows, setItemRows] = useWorkspaceScopedState<ServiceOrderItemGridRow[]>("service-orders.itemRows", [createEmptyServiceOrderItemGridRow(1)]);
  const latestDetailRequestId = useRef(0);

  const activeCompany = session?.companies.find((company) => company.tenantId === session?.tenantId) ?? null;
  const activeBranch = session?.branches.find((branch) => branch.id === session?.activeBranchId) ?? null;
  const canPersistInContext = Boolean(session?.tenantId && session?.activeBranchId);

  const selectedOrder = details?.serviceOrder ?? null;
  const selectedCustomerId = headerForm.customerId || selectedOrder?.customerId || null;
  const { closeWorkspace } = useWorkspaceManager();
  const { currentTabId, navigateWithinWorkspace, openWorkspaceInNewTab } = useWorkspaceRegistration({
    label: showCreateForm ? "OS: Nova" : selectedOrder ? `OS ${selectedOrder.orderNo}` : "Ordens de serviço",
    subtitle: showCreateForm ? "Novo cadastro" : selectedOrder ? osDeliveryTypeLabel(selectedOrder.deliveryType) : null,
  });
  const isFormWorkspace = workspaceMode === "new" || Boolean(focusServiceOrderId);
  const isListWorkspace = !isFormWorkspace;
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

      openWorkspaceInNewTab(targetPath, focusSection === "measurements" ? "Medidas" : "Cliente", {
        cloneCurrent: false,
      });
    },
    [isMobile, navigateWithinWorkspace, openWorkspaceInNewTab, selectedCustomerId],
  );

  const attendantLookupOptions = useMemo<SmartLookupOption[]>(() => {
    const options = users.map((user) => ({
      id: user.id,
      label: user.displayName,
      hint: user.email ?? undefined,
    }));
    const currentUser = session?.user;
    if (currentUser && !options.some((option) => option.id === currentUser.id)) {
      options.unshift({ id: currentUser.id, label: currentUser.displayName, hint: currentUser.email });
    }
    if (
      details?.commercialResponsible &&
      !options.some((option) => option.id === details.commercialResponsible?.id)
    ) {
      options.unshift({
        id: details.commercialResponsible.id,
        label: details.commercialResponsible.displayName,
        hint: details.commercialResponsible.email ?? undefined,
      });
    }
    return options;
  }, [details?.commercialResponsible, session?.user, users]);

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

  const orderLookupOptions = useMemo<SmartLookupOption[]>(
    () =>
      orders.map((order) => ({
        id: order.id,
        label: order.orderNo,
        hint: [osStatusLabel(order.status), osDeliveryTypeLabel(order.deliveryType), order.operationalPriority]
          .filter(Boolean)
          .join(" · ") || undefined,
      })),
    [orders],
  );

  const openCreateCustomerFromLookup = useCallback(
    (query: string) => {
      const params = new URLSearchParams();
      params.set("workspaceMode", "new");
      if (query.trim()) {
        params.set("prefillName", query.trim());
      }
      const targetPath = `/customers?${params.toString()}`;
      if (isMobile) {
        navigateWithinWorkspace(targetPath);
        return;
      }
      openWorkspaceInNewTab(targetPath, "Cliente: Novo", { cloneCurrent: false, subtitle: "Novo cadastro" });
    },
    [isMobile, navigateWithinWorkspace, openWorkspaceInNewTab],
  );

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
          formatWorkspaceMessage(error, "A OS não pôde ser carregada. Confira o acesso e tente de novo."),
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
          formatWorkspaceMessage(error, "As OS não puderam ser carregadas. Confira filtros, acesso e a Filial do contexto."),
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
          "A busca de clientes não pôde ser carregada. Confira o acesso a Clientes antes de criar a OS.",
        ),
      );
    } finally {
      setLoadingCustomers(false);
    }
  }, [apiJson, canReadCustomers, canWrite]);

  const loadUsers = useCallback(async () => {
    if (!canReadUsers) {
      setUsers(session?.user ? [{ id: session.user.id, displayName: session.user.displayName, email: session.user.email }] : []);
      return;
    }
    try {
      const response = await apiJson<ActorSummary[]>("/users");
      setUsers(response);
    } catch {
      setUsers(session?.user ? [{ id: session.user.id, displayName: session.user.displayName, email: session.user.email }] : []);
    }
  }, [apiJson, canReadUsers, session?.user]);

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
    const timeoutId = window.setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUsers, session?.tenantId]);

  useEffect(() => {
    if (!headerForm.attendantId && session?.user?.id) {
      setHeaderForm((current) => ({ ...current, attendantId: session.user?.id ?? current.attendantId }));
    }
  }, [headerForm.attendantId, session?.user?.id, setHeaderForm]);

  useEffect(() => {
    if (!canRead || !session?.activeBranchId) {
      return;
    }
    if (!showCreateForm) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({
            branchId: session.activeBranchId ?? "",
            deliveryType: headerForm.deliveryType,
            itemCount: String(visibleItemRows.length || 1),
          });
          const suggestion = await apiJson<{ promisedDeliveryDate: string; promisedDeliveryTime: string }>(
            `/service-orders/delivery-preview?${params.toString()}`,
          );
          setHeaderForm((current) => ({
            ...current,
            promisedDeliveryDate: suggestion.promisedDeliveryDate,
            promisedDeliveryTime: suggestion.promisedDeliveryTime,
          }));
        } catch {
          /* a atendente ainda pode preencher a saída na mão */
        }
      })();
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [apiJson, canRead, headerForm.deliveryType, session?.activeBranchId, setHeaderForm, showCreateForm, visibleItemRows.length]);

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
    if (!isListWorkspace) {
      return;
    }

    setShowCreateForm(false);
    setActiveOrderId(null);
    setDetails(null);
  }, [isListWorkspace, setActiveOrderId, setShowCreateForm]);

  const openCreateForm = useCallback(() => {
    setShowCreateForm(true);
    setDetails(null);
    setActiveOrderId(null);
    setHeaderForm(createEmptyHeaderForm(session?.user?.id ?? ""));
    setItemRows([createEmptyServiceOrderItemGridRow(1)]);
    setMessage(null);
  }, [session?.user?.id, setActiveOrderId, setHeaderForm, setItemRows, setShowCreateForm]);

  const openCreateWorkspace = useCallback(() => {
    const targetPath = "/service-orders?workspaceMode=new";
    if (isMobile) {
      navigateWithinWorkspace(targetPath);
      return;
    }

    openWorkspaceInNewTab(targetPath, "OS: Nova", { cloneCurrent: false, subtitle: "Novo cadastro" });
  }, [isMobile, navigateWithinWorkspace, openWorkspaceInNewTab]);

  const openServiceOrderWorkspace = useCallback(
    (order: { id: string; orderNo: string; deliveryType?: string }) => {
      const targetPath = `/service-orders?focusServiceOrderId=${encodeURIComponent(order.id)}`;
      if (isMobile) {
        navigateWithinWorkspace(targetPath);
        return;
      }

      openWorkspaceInNewTab(targetPath, `OS ${order.orderNo}`, {
        cloneCurrent: false,
        subtitle: order.deliveryType ? osDeliveryTypeLabel(order.deliveryType) : null,
      });
    },
    [isMobile, navigateWithinWorkspace, openWorkspaceInNewTab],
  );

  const closeServiceOrderWorkspace = useCallback(() => {
    if (!currentTabId || isMobile) {
      setShowCreateForm(false);
      setActiveOrderId(null);
      setDetails(null);
      navigateWithinWorkspace("/service-orders");
      return;
    }

    const closingTabId = currentTabId;
    openWorkspaceInNewTab("/service-orders", "Ordens de serviço", { cloneCurrent: false });
    window.setTimeout(() => {
      closeWorkspace(closingTabId);
    }, 0);
  }, [closeWorkspace, currentTabId, isMobile, navigateWithinWorkspace, openWorkspaceInNewTab, setActiveOrderId, setShowCreateForm]);

  useEffect(() => {
    if (workspaceMode !== "new") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      openCreateForm();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [openCreateForm, workspaceMode]);

  function validateItems(requireAtLeastOneItem: boolean) {
    if (requireAtLeastOneItem && visibleItemRows.length === 0) {
      return "Inclua pelo menos uma peça antes de salvar a OS.";
    }

    for (const row of visibleItemRows) {
      if (!row.itemType.trim() || !row.description.trim()) {
        return "Cada peça precisa de produto e serviço/observação antes de salvar.";
      }
      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return "A quantidade de cada peça precisa ser maior que zero.";
      }
    }

    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;

    if (!canPersistInContext || !session?.activeBranchId) {
      setMessage("Escolha a Filial no contexto antes de salvar a OS.");
      return;
    }
    if (!headerForm.customerId) {
      setMessage("Escolha o cliente antes de salvar a OS.");
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
          promisedDeliveryDate: headerForm.promisedDeliveryDate || undefined,
          promisedDeliveryTime: headerForm.promisedDeliveryTime || undefined,
          commercialResponsibleActorId: headerForm.attendantId || session?.user?.id || undefined,
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
      setMessage("OS salva. O cabeçalho e as peças foram gravados e a nova OS já está selecionada.");
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "A OS não pôde ser salva. Confira o contexto ativo, o cliente e as peças, e tente de novo.",
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
      setMessage("Escolha o cliente antes de atualizar a OS.");
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
          promisedDeliveryDate: headerForm.promisedDeliveryDate || undefined,
          promisedDeliveryTime: headerForm.promisedDeliveryTime || undefined,
          commercialResponsibleActorId: headerForm.attendantId || undefined,
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
        `OS atualizada. Cabeçalho gravado e peças aplicadas: ${plan.create.length} inclusão(ões), ${plan.update.length} alteração(ões) e ${plan.remove.length} exclusão(ões).`,
      );
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "A OS não pôde ser atualizada. Confira o cabeçalho e as peças, e tente de novo.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <section className="mini-card">
        <h3>Ordens de serviço indisponíveis</h3>
        <p>Você não possui acesso às OS no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      {!isListWorkspace ? (
        <section className="hero-card">
          <div className="eyebrow">Operações</div>
          <h1 className="title">{showCreateForm ? "Nova OS" : selectedOrder ? `OS ${selectedOrder.orderNo}` : "Ordem de serviço"}</h1>
          <p>A Empresa e a Filial vêm do contexto ativo. Preencha o cabeçalho e as peças na mesma aba.</p>
        </section>
      ) : null}

      {message ? <WorkspaceFlash message={message} /> : null}

      {isListWorkspace ? (
        <CadastroListPanel
          applyFilters={applyOsListFilters}
          buildExcelCsv={buildOsExcelCsv}
          canWrite={canWrite}
          columnStorageKey="anexsys.frontend.os.grid-columns.v1"
          columns={[
            {
              id: "name",
              label: "OS",
              locked: true,
              render: (row) => (
                <>
                  <strong>{row.orderNo}</strong>
                  <div className="table-subtle">
                    {osDeliveryTypeLabel(row.deliveryType)}
                    {row.operationalPriority ? ` · ${row.operationalPriority}` : ""}
                  </div>
                </>
              ),
            },
            { id: "delivery", label: "Entrega", render: (row) => formatDate(row.promisedDeliveryDate) },
            { id: "type", label: "Tipo", render: (row) => osDeliveryTypeLabel(row.deliveryType) },
            {
              id: "status",
              label: "Status",
              render: (row) => (
                <span className={`status-chip status-chip--${row.status === "cancelled" ? "inactive" : "active"}`}>
                  {osStatusLabel(row.status)}
                </span>
              ),
            },
            { id: "value", label: "Valor", render: (row) => row.totalValue ?? "—" },
          ]}
          defaultColumnIds={["name", "delivery", "status"]}
          emptyFilters={{ name: "", status: "", deliveryType: "" }}
          emptyMessage="Nenhuma OS encontrada para os filtros informados."
          excelFileName="ordens-de-servico.csv"
          filterFields={[
            { id: "name", label: "Número", lookup: true, placeholder: "Número já cadastrado" },
            {
              id: "status",
              kind: "select",
              label: "Status",
              options: [
                { value: "", label: "Todos" },
                { value: "open", label: "Aberta" },
                { value: "approved", label: "Aprovada" },
                { value: "cancelled", label: "Cancelada" },
              ],
            },
            {
              id: "deliveryType",
              kind: "select",
              label: "Tipo de entrega",
              options: [
                { value: "", label: "Todos" },
                { value: "Standard", label: "Normal" },
                { value: "Priority", label: "Urgente" },
                { value: "Express", label: "Expresso" },
              ],
            },
          ]}
          loading={loading}
          onCreate={openCreateWorkspace}
          onEdit={openServiceOrderWorkspace}
          records={orders}
          rowLabel={(row) => row.orderNo}
          searchKey="name"
          searchOptions={orderLookupOptions}
          searchPlaceholder="Buscar por número"
          title="Ordens de serviço"
        />
      ) : null}

        {!isListWorkspace ? (
        <article className="mini-card cadastro-form">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar__copy">
              <h3>{showCreateForm ? "Nova OS" : selectedOrder ? `OS ${selectedOrder.orderNo}` : "Ordem de serviço"}</h3>
              <p>
                {showCreateForm
                  ? "A Empresa e a Filial vêm do contexto ativo. Cadastre o cabeçalho e as peças sem sair desta aba."
                  : selectedOrder
                    ? "Altere o cabeçalho e as peças sem perder a lista de OS."
                    : "Abra uma OS na grade ou cadastre uma nova."}
              </p>
            </div>
            {!showCreateForm && selectedOrder && canWrite ? (
              <button className="button-secondary" onClick={openCreateWorkspace} type="button">
                Nova OS
              </button>
            ) : null}
          </div>

          {detailLoading && !showCreateForm ? <div className="empty-state">Carregando a OS…</div> : null}

          {showCreateForm || selectedOrder ? (
            <form className="form-grid" onSubmit={showCreateForm ? handleCreate : handleUpdate}>
              <div className="mini-section">
                <h4>Dados da ordem de serviço</h4>
                <p>Número, cliente, situação, entrada e a previsão de saída.</p>
                <div className="os-header-grid">
                  <label className="field">
                    <span>Número</span>
                    <input disabled value={selectedOrder?.orderNo ?? "Gerado ao salvar"} />
                  </label>
                  <div className="field">
                    <SmartLookup
                      allowClear={false}
                      canCreate={canWriteCustomers}
                      createLabel="Cadastrar"
                      disabled={saving || (!showCreateForm && !canEditSelectedOrder) || !canReadCustomers}
                      emptyMessage={
                        loadingCustomers
                          ? "Carregando clientes…"
                          : canReadCustomers
                            ? "Nenhum cliente encontrado."
                            : "A busca de cliente depende da permissão de Clientes."
                      }
                      entityType="customers"
                      label="Cliente"
                      onChange={(option) => setHeaderForm((current) => ({ ...current, customerId: option?.id ?? "" }))}
                      onCreate={openCreateCustomerFromLookup}
                      onOpen={() => {
                        void loadCustomers();
                      }}
                      options={customerLookupOptions}
                      searchPlaceholder="Digite o nome do cliente"
                      value={headerForm.customerId}
                    />
                    <div className="button-row">
                      <button
                        className="button-secondary"
                        disabled={!selectedCustomerId}
                        onClick={() => openRelatedCustomerWorkspace()}
                        type="button"
                      >
                        Abrir cliente
                      </button>
                      <button
                        className="button-secondary"
                        disabled={!selectedCustomerId}
                        onClick={() => openRelatedCustomerWorkspace("measurements")}
                        type="button"
                      >
                        Abrir medidas
                      </button>
                    </div>
                  </div>
                  <label className="field">
                    <span>Situação</span>
                    <input disabled value={selectedOrder ? osStatusLabel(selectedOrder.status) : "Aberta"} />
                  </label>
                  <div className="field">
                    <span>Entrada</span>
                    <div className="os-datetime">
                      <input
                        disabled
                        type="date"
                        value={selectedOrder ? toDateInput(selectedOrder.openedAt) : nowDateInput()}
                      />
                      <input
                        disabled
                        type="time"
                        value={selectedOrder ? toTimeInput(null, selectedOrder.openedAt) : nowTimeInput()}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <span>Saída</span>
                    <div className="os-datetime">
                      <input
                        disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                        required
                        type="date"
                        value={headerForm.promisedDeliveryDate}
                        onChange={(event) =>
                          setHeaderForm((current) => ({ ...current, promisedDeliveryDate: event.target.value }))
                        }
                      />
                      <input
                        disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                        required
                        type="time"
                        value={headerForm.promisedDeliveryTime}
                        onChange={(event) =>
                          setHeaderForm((current) => ({ ...current, promisedDeliveryTime: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <label className="field">
                    <span>Tipo de entrega</span>
                    <select
                      disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                      value={headerForm.deliveryType}
                      onChange={(event) => {
                        const deliveryType = event.target.value as ServiceOrderHeaderForm["deliveryType"];
                        setHeaderForm((current) => ({ ...current, deliveryType }));
                        if (!showCreateForm && session?.activeBranchId) {
                          const params = new URLSearchParams({
                            branchId: session.activeBranchId,
                            deliveryType,
                            itemCount: String(visibleItemRows.length || 1),
                          });
                          void apiJson<{ promisedDeliveryDate: string; promisedDeliveryTime: string }>(
                            `/service-orders/delivery-preview?${params.toString()}`,
                          )
                            .then((suggestion) => {
                              setHeaderForm((current) => ({
                                ...current,
                                promisedDeliveryDate: suggestion.promisedDeliveryDate,
                                promisedDeliveryTime: suggestion.promisedDeliveryTime,
                              }));
                            })
                            .catch(() => undefined);
                        }
                      }}
                    >
                      <option value="Standard">Normal</option>
                      <option value="Priority">Urgente</option>
                      <option value="Express">Expresso</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Empresa / Filial</span>
                    <input
                      disabled
                      value={`${activeCompany?.displayName ?? "Empresa"} · ${activeBranch?.label ?? "Filial"}`}
                    />
                  </label>
                  <label className="field">
                    <span>Prioridade</span>
                    <input
                      disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                      placeholder="Opcional"
                      value={headerForm.operationalPriority}
                      onChange={(event) =>
                        setHeaderForm((current) => ({ ...current, operationalPriority: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="mini-section">
                <h4>Responsáveis pela ordem de serviço</h4>
                <p>O técnico e o controle de qualidade entram depois, pelo QR. Não são obrigatórios agora.</p>
                <div className="os-header-grid">
                  <div className="field">
                    <SmartLookup
                      allowClear={false}
                      canCreate={false}
                      disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                      emptyMessage="Nenhum atendente encontrado."
                      entityType="employees"
                      label="Atendente"
                      onChange={(option) => setHeaderForm((current) => ({ ...current, attendantId: option?.id ?? "" }))}
                      options={attendantLookupOptions}
                      searchPlaceholder="Quem está abrindo a OS"
                      value={headerForm.attendantId || session?.user?.id || ""}
                    />
                  </div>
                  <label className="field">
                    <span>Técnico</span>
                    <input
                      disabled
                      placeholder="Assume ao ler o QR"
                      value={details?.productionTechnician?.displayName ?? ""}
                    />
                  </label>
                  <label className="field">
                    <span>Controle de qualidade</span>
                    <input
                      disabled
                      placeholder="Preenche ao revisar e aprovar"
                      value={details?.qualityReviewer?.displayName ?? ""}
                    />
                  </label>
                </div>
              </div>

              <label className="field">
                <span>Observações comerciais</span>
                <textarea
                  disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                  rows={3}
                  value={headerForm.commercialNotes}
                  onChange={(event) => setHeaderForm((current) => ({ ...current, commercialNotes: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Observações do cliente</span>
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
                    <h4>Peças</h4>
                    <p>Inclua, altere e remova várias peças sem sair desta OS.</p>
                  </div>
                  {(showCreateForm || canEditSelectedOrder) ? (
                    <button
                      className="button-secondary"
                      disabled={saving}
                      onClick={() => setItemRows((current) => addServiceOrderItemGridRow(current))}
                      type="button"
                    >
                      Adicionar peça
                    </button>
                  ) : null}
                </div>

                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Peça</th>
                        <th>Produto</th>
                        <th>Serviço / observação</th>
                        <th>Qtd</th>
                        <th>Status</th>
                        <th>Ações</th>
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
                                placeholder="Calça, vestido, camisa"
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
                                placeholder="Bainha original, bainha 58 cm, só punho esquerdo"
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
                                {row.isNew ? "Nova" : osStatusLabel(row.status)}
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
                                    {showCreateForm || row.isEditing ? "Concluir" : "Alterar"}
                                  </button>
                                ) : null}
                                {canMutateRow ? (
                                  <button
                                    className="button-ghost"
                                    disabled={saving}
                                    onClick={() => setItemRows((current) => removeServiceOrderItemGridRow(current, row.localId))}
                                    type="button"
                                  >
                                    Excluir
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
                            <div className="empty-state">Nenhuma peça na grade. Use Adicionar peça para continuar.</div>
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
                      {saving ? "Salvando…" : "Salvar"}
                    </button>
                    <button className="button-secondary" onClick={closeServiceOrderWorkspace} type="button">
                      Cancelar
                    </button>
                  </>
                ) : selectedOrder ? (
                  <>
                    <button className="button" disabled={saving || !canEditSelectedOrder} type="submit">
                      {saving ? "Salvando…" : "Salvar alterações"}
                    </button>
                    <button className="button-secondary" onClick={closeServiceOrderWorkspace} type="button">
                      Cancelar
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="empty-state">Abra uma OS na grade ou clique em Nova OS para começar.</div>
          )}
        </article>
        ) : null}
    </>
  );
}
