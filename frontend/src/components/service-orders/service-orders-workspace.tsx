"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useWorkspaceManager, useWorkspaceRegistration, useWorkspaceScopedState } from "@/components/app-shell/workspace-manager";
import { useWorkspaceSearchParams } from "@/components/app-shell/workspace-pane";
import { useWorkspaceViewportMode } from "@/components/app-shell/workspace-responsive";
import { useSession } from "@/components/providers/session-provider";
import { CadastroListPanel } from "@/components/ui/cadastro-list-panel";
import { WorkspaceFlash, describeWorkspaceError } from "@/components/ui/workspace-flash";
import { SmartLookup, type SmartLookupOption } from "@/components/ui/smart-lookup";
import {
  buildOsWhatsAppMessage,
  openEmailResend,
  openWhatsAppResend,
  printProductionOrderDocument,
  printServiceOrderDocument,
  reservePrintWindow,
  type OpPrintView,
  type OsPrintView,
} from "@/components/service-orders/os-documents";
import { applyOsListFilters, buildOsExcelCsv, osDeliveryTypeLabel, osStatusLabel } from "@/components/service-orders/os-list";
import { OsPayPanel, type OsFinancialSummary } from "@/components/service-orders/os-pay-panel";
import { RowOverflowMenu, type RowMenuItem } from "@/components/ui/row-overflow-menu";
import {
  addServiceOrderItemGridRow,
  applyOsMoneyTyping,
  buildCreateServiceOrderItemsPayload,
  buildServiceOrderItemMutationPlan,
  calculateServiceOrderItemSubtotal,
  calculateServiceOrderLaborTotal,
  canAddServiceOrderItemGridRow,
  createEmptyServiceOrderItemGridRow,
  DEFAULT_CUSTOMER_NOTE,
  formatOsMoney,
  formatOsMoneyInput,
  getVisibleServiceOrderItemGridRows,
  mapServiceOrderItemsToGridRows,
  MAX_SERVICE_ORDER_ITEMS,
  osPaymentConditionLabel,
  previewNextLinkedServiceOrderNo,
  removeServiceOrderItemGridRow,
  runClosedBagCommit,
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
  actualDeliveryDate?: string | null;
  actualDeliveryTime?: string | null;
  bagClosed?: boolean;
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
  maxPiecesPerBag?: number;
  groupVersions?: Array<{ id: string; orderNo: string; versionSuffix: string | null }>;
};

type CustomerLookupRecord = {
  id: string;
  legalName: string;
  tradeName: string | null;
  email: string | null;
  cpfCnpj: string | null;
};

type CatalogLookupRecord = {
  id: string;
  displayName: string;
  defaultPrice?: string | null;
  status?: string;
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
    promisedDeliveryTime: nowTimeInput(),
    attendantId,
    commercialNotes: "",
    customerNotes: DEFAULT_CUSTOMER_NOTE,
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
  return describeWorkspaceError(error, fallback);
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
  const canReadFinance = hasAnyPermission("finance.read");
  const canWriteFinance = hasAnyPermission("finance.write");
  const canReadProduction = hasAnyPermission("production_orders.read");
  const canWriteProduction = hasAnyPermission("production_orders.write");
  const [orders, setOrders] = useState<ServiceOrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerLookupRecord[]>([]);
  const [products, setProducts] = useState<CatalogLookupRecord[]>([]);
  const [services, setServices] = useState<CatalogLookupRecord[]>([]);
  const [users, setUsers] = useState<ActorSummary[]>([]);
  const [payTarget, setPayTarget] = useState<{ orderNo: string; summary: OsFinancialSummary } | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<OsFinancialSummary | null>(null);
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
  const [maxPiecesPerBag, setMaxPiecesPerBag] = useState(MAX_SERVICE_ORDER_ITEMS);
  const [previewOrderNo, setPreviewOrderNo] = useState("—");
  const [wantsNextVersion, setWantsNextVersion] = useState(false);
  const latestDetailRequestId = useRef(0);

  const activeCompany = session?.companies.find((company) => company.tenantId === session?.tenantId) ?? null;
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
  const bagClosed = Boolean(selectedOrder?.bagClosed);
  const canEditSelectedOrder = canWrite && selectedOrder !== null && selectedOrder.status !== "cancelled" && !bagClosed;

  useEffect(() => {
    setWantsNextVersion(false);
  }, [selectedOrder?.id, showCreateForm]);
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

  const productLookupOptions = useMemo<SmartLookupOption[]>(() => {
    const options = products
      .filter((product) => product.status !== "inactive")
      .map((product) => ({ id: product.id, label: product.displayName }));
    for (const row of visibleItemRows) {
      if (row.productId && !options.some((option) => option.id === row.productId)) {
        options.unshift({ id: row.productId, label: row.itemType || "Produto" });
      }
    }
    return options;
  }, [products, visibleItemRows]);

  const serviceLookupOptions = useMemo<SmartLookupOption[]>(() => {
    const options = services
      .filter((service) => service.status !== "inactive")
      .map((service) => ({
        id: service.id,
        label: service.displayName,
        hint: service.defaultPrice ? formatOsMoney(Number(service.defaultPrice)) : undefined,
      }));
    for (const row of visibleItemRows) {
      if (row.serviceId && !options.some((option) => option.id === row.serviceId)) {
        options.unshift({ id: row.serviceId, label: row.description || "Serviço", hint: undefined });
      }
    }
    return options;
  }, [services, visibleItemRows]);

  const laborTotal = useMemo(() => calculateServiceOrderLaborTotal(itemRows), [itemRows]);
  const nextVersionNo = useMemo(
    () =>
      selectedOrder?.orderNo
        ? previewNextLinkedServiceOrderNo(
            selectedOrder.orderNo,
            (details?.groupVersions ?? []).map((version) => version.orderNo),
          )
        : "",
    [details?.groupVersions, selectedOrder?.orderNo],
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
        if (response.maxPiecesPerBag) {
          setMaxPiecesPerBag(response.maxPiecesPerBag);
        }
        if (!showCreateForm) {
          setHeaderForm(mapDetailsToHeaderForm(response));
          const mapped = mapServiceOrderItemsToGridRows(response.items);
          setItemRows(mapped.length > 0 ? mapped : [createEmptyServiceOrderItemGridRow(1)]);
        }
        if (canReadFinance || canWriteFinance) {
          try {
            const summary = await apiJson<OsFinancialSummary>(`/service-orders/${serviceOrderId}/financial-summary`);
            if (latestDetailRequestId.current === requestId) {
              setPaymentSummary(summary);
            }
          } catch {
            if (latestDetailRequestId.current === requestId) {
              setPaymentSummary(null);
            }
          }
        } else {
          setPaymentSummary(null);
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
    [apiJson, canReadFinance, canWriteFinance, focusServiceOrderId, navigateWithinWorkspace, setHeaderForm, setItemRows, showCreateForm, workspaceMode],
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

  const loadCatalogs = useCallback(async () => {
    if (!canRead) {
      setProducts([]);
      setServices([]);
      return;
    }
    try {
      const [productResponse, serviceResponse] = await Promise.all([
        apiJson<CatalogLookupRecord[]>("/garment-products"),
        apiJson<CatalogLookupRecord[]>("/atelier-services"),
      ]);
      setProducts(productResponse);
      setServices(serviceResponse);
    } catch {
      setProducts([]);
      setServices([]);
    }
  }, [apiJson, canRead]);

  const loadBagSettings = useCallback(async () => {
    if (!canRead) {
      return;
    }
    try {
      const settings = await apiJson<{ maxPiecesPerBag: number }>("/service-orders/settings");
      if (settings.maxPiecesPerBag > 0) {
        setMaxPiecesPerBag(settings.maxPiecesPerBag);
      }
    } catch {
      /* o padrão da Conta continua valendo na grade */
    }
  }, [apiJson, canRead]);

  const loadNextOrderNo = useCallback(async () => {
    if (!canRead) {
      return;
    }
    try {
      const next = await apiJson<{ orderNo: string }>("/service-orders/next-number");
      setPreviewOrderNo(next.orderNo);
    } catch {
      setPreviewOrderNo("—");
    }
  }, [apiJson, canRead]);

  const openPay = useCallback(
    async (order: Pick<ServiceOrderRecord, "id" | "orderNo">) => {
      if (!canReadFinance && !canWriteFinance) {
        setMessage("O pagamento depende da permissão financeira.");
        return;
      }
      try {
        const summary = await apiJson<OsFinancialSummary>(`/service-orders/${order.id}/financial-summary`);
        setPayTarget({ orderNo: order.orderNo, summary });
      } catch (error) {
        setMessage(formatWorkspaceMessage(error, "O resumo financeiro não pôde ser carregado."));
      }
    },
    [apiJson, canReadFinance, canWriteFinance],
  );

  const companyName = activeCompany?.displayName ?? "ANEXSYS";

  const printServiceOrder = useCallback(
    async (serviceOrderId: string) => {
      try {
        const view = await apiJson<OsPrintView>(`/service-orders/${serviceOrderId}/print-view`);
        printServiceOrderDocument(view, companyName);
        setMessage(`OS ${view.orderNo} enviada para impressão, com valores.`);
      } catch (error) {
        setMessage(formatWorkspaceMessage(error, "A OS não pôde ser impressa."));
      }
    },
    [apiJson, companyName],
  );

  const printProductionOrder = useCallback(
    async (serviceOrderId: string, reservedWindow?: Window | null) => {
      let productionOrderId = "";
      try {
        const existing = await apiJson<{ productionOrder: { id: string } }>(`/service-orders/${serviceOrderId}/production-order`);
        productionOrderId = existing.productionOrder.id;
      } catch {
        if (!canWriteProduction) {
          throw new Error("Esta OS ainda não tem Ordem de Produção.");
        }
        const created = await apiJson<{ productionOrder: { id: string } }>(
          `/service-orders/${serviceOrderId}/production-order/generate`,
          { method: "POST" },
        );
        productionOrderId = created.productionOrder.id;
      }
      const view = await apiJson<OpPrintView>(`/production-orders/${productionOrderId}/print-view`);
      let paymentCondition = osPaymentConditionLabel(paymentSummary?.paymentStatus);
      try {
        const summary = await apiJson<OsFinancialSummary>(`/service-orders/${serviceOrderId}/financial-summary`);
        paymentCondition = osPaymentConditionLabel(summary.paymentStatus);
        setPaymentSummary(summary);
      } catch {
        /* a OP sai mesmo se o financeiro não puder ser lido; parcial e em aberto = Pagar na retirada */
      }
      printProductionOrderDocument(view, companyName, reservedWindow, paymentCondition);
      return view;
    },
    [apiJson, canWriteProduction, companyName, paymentSummary?.paymentStatus],
  );

  const resendWhatsApp = useCallback(
    async (serviceOrderId: string) => {
      try {
        const view = await apiJson<OsPrintView>(`/service-orders/${serviceOrderId}/print-view`);
        openWhatsAppResend(
          view.customer.phone,
          buildOsWhatsAppMessage({
            customerName: view.customer.legalName,
            companyName,
            orderNo: view.orderNo,
          }),
        );
        setMessage(`WhatsApp da OS ${view.orderNo} aberto para reenvio.`);
      } catch (error) {
        setMessage(formatWorkspaceMessage(error, "O WhatsApp não pôde ser aberto para reenvio."));
      }
    },
    [apiJson, companyName],
  );

  const resendEmail = useCallback(
    async (serviceOrderId: string) => {
      try {
        const view = await apiJson<OsPrintView>(`/service-orders/${serviceOrderId}/print-view`);
        openEmailResend(
          view.customer.email,
          `Ordem de serviço ${view.orderNo}`,
          buildOsWhatsAppMessage({
            customerName: view.customer.legalName,
            companyName,
            orderNo: view.orderNo,
          }),
        );
        setMessage(`E-mail da OS ${view.orderNo} aberto para reenvio.`);
      } catch (error) {
        setMessage(formatWorkspaceMessage(error, "O e-mail não pôde ser aberto para reenvio."));
      }
    },
    [apiJson, companyName],
  );

  const buildOsRowMenu = useCallback(
    (row: Pick<ServiceOrderRecord, "id" | "orderNo">): RowMenuItem[] => [
      {
        id: "print",
        label: "Imprimir",
        children: [
          {
            id: "print-os",
            label: "Ordem de serviço (com valores)",
            onSelect: () => {
              void printServiceOrder(row.id);
            },
          },
          {
            id: "print-op",
            label: "Ordem de produção (sem valores)",
            disabled: !canReadProduction && !canWriteProduction,
            onSelect: () => {
              void printProductionOrder(row.id)
                .then((view) => {
                  setMessage(`Ordem de produção ${view.productionNo} enviada para impressão, sem valores.`);
                })
                .catch((error) => {
                  setMessage(formatWorkspaceMessage(error, "A Ordem de Produção não pôde ser impressa."));
                });
            },
          },
        ],
      },
      {
        id: "resend",
        label: "Reenviar",
        children: [
          {
            id: "whatsapp",
            label: "Por WhatsApp",
            onSelect: () => {
              void resendWhatsApp(row.id);
            },
          },
          {
            id: "email",
            label: "Por e-mail",
            onSelect: () => {
              void resendEmail(row.id);
            },
          },
        ],
      },
    ],
    [canReadProduction, canWriteProduction, printProductionOrder, printServiceOrder, resendEmail, resendWhatsApp],
  );

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
    const timeoutId = window.setTimeout(() => {
      void loadCatalogs();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCatalogs, session?.tenantId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBagSettings();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadBagSettings, session?.tenantId]);

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
            promisedDeliveryTime: current.promisedDeliveryTime || nowTimeInput(),
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
    setPaymentSummary(null);
  }, [isListWorkspace, setActiveOrderId, setShowCreateForm]);

  const openCreateForm = useCallback(() => {
    setShowCreateForm(true);
    setDetails(null);
    setActiveOrderId(null);
    setPaymentSummary(null);
    setHeaderForm(createEmptyHeaderForm(session?.user?.id ?? ""));
    setItemRows([createEmptyServiceOrderItemGridRow(1)]);
    setMessage(null);
    void loadNextOrderNo();
  }, [loadNextOrderNo, session?.user?.id, setActiveOrderId, setHeaderForm, setItemRows, setShowCreateForm]);

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
    const discardEmptyLinkedVersion = () => {
      if (
        canWrite &&
        selectedOrder &&
        (details?.items.length ?? 0) === 0 &&
        (details?.groupVersions?.length ?? 0) > 1
      ) {
        void apiJson(`/service-orders/${selectedOrder.id}/cancel`, { method: "POST" }).catch(() => undefined);
      }
    };

    discardEmptyLinkedVersion();

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
  }, [
    apiJson,
    canWrite,
    closeWorkspace,
    currentTabId,
    details?.groupVersions?.length,
    details?.items.length,
    isMobile,
    navigateWithinWorkspace,
    openWorkspaceInNewTab,
    selectedOrder,
    setActiveOrderId,
    setShowCreateForm,
  ]);

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

    if (visibleItemRows.length > maxPiecesPerBag) {
      return `Esta versão da OS aceita no máximo ${maxPiecesPerBag} peças. Feche a sacola para abrir a próxima versão.`;
    }

    for (const row of visibleItemRows) {
      if (!row.itemType.trim() || !row.description.trim()) {
        return "Cada peça precisa de produto e serviço antes de salvar.";
      }
      if (!row.brand.trim()) {
        return "Cada peça precisa da marca.";
      }
      if (Number(row.quantity) !== 1) {
        return "Cada linha é uma peça. A quantidade fica em 1.";
      }
    }

    return null;
  }

  async function persistCurrentServiceOrder(requireAtLeastOneItem: boolean) {
    if (!canWrite) {
      throw new Error("Você não tem permissão para gravar a OS.");
    }

    if (showCreateForm) {
      if (!canPersistInContext || !session?.activeBranchId) {
        throw new Error("Escolha a Filial no contexto antes de salvar a OS.");
      }
      if (!headerForm.customerId) {
        throw new Error("Escolha o cliente antes de salvar a OS.");
      }

      const itemValidation = validateItems(requireAtLeastOneItem);
      if (itemValidation) {
        throw new Error(itemValidation);
      }

      const created = await apiJson<CreateServiceOrderResponse>("/service-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: session.activeBranchId,
          customerId: headerForm.customerId,
          deliveryType: headerForm.deliveryType,
          promisedDeliveryDate: headerForm.promisedDeliveryDate || undefined,
          promisedDeliveryTime: toTimeInput(headerForm.promisedDeliveryTime) || undefined,
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
      return { id: createdId, orderNo: created.serviceOrder.orderNo };
    }

    if (!selectedOrder || !canEditSelectedOrder) {
      throw new Error("Esta OS não pode ser alterada.");
    }
    if (!headerForm.customerId) {
      throw new Error("Escolha o cliente antes de atualizar a OS.");
    }

    const itemValidation = validateItems(requireAtLeastOneItem);
    if (itemValidation) {
      throw new Error(itemValidation);
    }

    await apiJson<ServiceOrderRecord>(`/service-orders/${selectedOrder.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        customerId: headerForm.customerId,
        deliveryType: headerForm.deliveryType,
        promisedDeliveryDate: headerForm.promisedDeliveryDate || undefined,
        promisedDeliveryTime: toTimeInput(headerForm.promisedDeliveryTime) || undefined,
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
          productId: item.productId,
          serviceId: item.serviceId,
          description: item.description,
          complement: item.complement,
          brand: item.brand,
          model: item.model,
          serialNo: item.serialNo,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountValue: item.discountValue,
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

    return { id: selectedOrder.id, orderNo: selectedOrder.orderNo };
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bagClosed) {
      await handleClosedBagSave();
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const persisted = await persistCurrentServiceOrder(true);
      await loadOrders(persisted.id);
      navigateWithinWorkspace(`/service-orders?focusServiceOrderId=${encodeURIComponent(persisted.id)}`);
      setMessage("OS salva como rascunho. A sacola ainda está aberta e a OP ainda não foi gerada.");
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
    if (bagClosed) {
      await handleClosedBagSave();
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const persisted = await persistCurrentServiceOrder(false);
      await loadOrders(persisted.id);
      setMessage("OS atualizada como rascunho. A sacola ainda está aberta e a OP ainda não foi gerada.");
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

  async function persistAndCloseBag() {
    const persisted = await persistCurrentServiceOrder(true);
    const closed = await apiJson<ServiceOrderDetail>(`/service-orders/${persisted.id}/close-bag`, {
      method: "POST",
    });
    return closed;
  }

  async function openNextVersionInNewTab(sourceServiceOrderId: string) {
    const next = await apiJson<ServiceOrderDetail>(`/service-orders/${sourceServiceOrderId}/next-version`, {
      method: "POST",
    });
    openServiceOrderWorkspace(next.serviceOrder);
    return next;
  }

  async function commitClosedBag(serviceOrder: ServiceOrderRecord, reservedWindow?: Window | null) {
    const result = await runClosedBagCommit({
      wantsNextVersion,
      spawnNext: () => openNextVersionInNewTab(serviceOrder.id),
      print: () => printProductionOrder(serviceOrder.id, reservedWindow),
    });
    if (result.next) {
      setWantsNextVersion(false);
    }
    return {
      printed: result.printed,
      nextOrderNo: result.next?.serviceOrder.orderNo ?? null,
      printError: result.printError,
    };
  }

  async function handleCloseBag() {
    if (!canWrite) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const closed = await persistAndCloseBag();
      setWantsNextVersion(false);
      await loadOrders(closed.serviceOrder.id);
      setMessage(
        "Sacola fechada. Esta versão ficou travada. Se errou, use Abrir sacola. Para imprimir a OP, clique em Salvar. Se ainda houver peças, marque Abrir nova versão e depois Salvar.",
      );
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "A sacola não pôde ser fechada. Confira as peças, grave de novo e tente fechar outra vez.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenBag() {
    if (!canWrite || !selectedOrder?.bagClosed) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await apiJson<ServiceOrderDetail>(`/service-orders/${selectedOrder.id}/open-bag`, {
        method: "POST",
      });
      setWantsNextVersion(false);
      await loadOrders(selectedOrder.id);
      setMessage("Sacola reaberta. Você pode corrigir as peças ou incluir a que o cliente pediu.");
    } catch (error) {
      setMessage(
        formatWorkspaceMessage(
          error,
          "A sacola não pôde ser reaberta. Tente de novo.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleClosedBagSave() {
    if (!canWrite || !selectedOrder?.bagClosed) {
      return;
    }

    setSaving(true);
    setMessage(null);
    const reservedPrintWindow = reservePrintWindow();
    try {
      const result = await commitClosedBag(selectedOrder, reservedPrintWindow);
      await loadOrders(selectedOrder.id);
      if (result.nextOrderNo && result.printError) {
        reservedPrintWindow?.close();
        setMessage(
          `A versão ${result.nextOrderNo} abriu em outra aba, já editável. A impressão da OP foi bloqueada pelo navegador. Permita pop-ups e reimprima pelo menu ⋮.`,
        );
        return;
      }
      setMessage(
        result.nextOrderNo
          ? `OP ${result.printed?.productionNo} da ${selectedOrder.orderNo} enviada para impressão. A versão ${result.nextOrderNo} abriu em outra aba, já editável.`
          : `OP ${result.printed?.productionNo} da ${selectedOrder.orderNo} enviada para impressão e já pode ir no bolso transparente.`,
      );
    } catch (error) {
      reservedPrintWindow?.close();
      setMessage(
        formatWorkspaceMessage(
          error,
          "A Ordem de Produção não pôde ser impressa. Confira a sacola e tente salvar de novo.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const canMutateItems = showCreateForm || canEditSelectedOrder;

  function focusItemRow(localId: string) {
    window.requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>(`[data-os-item-row="${localId}"]`);
      row?.querySelector<HTMLInputElement>("input:not([disabled])")?.focus();
    });
  }

  function addPieceRow() {
    if (!canAddServiceOrderItemGridRow(itemRows, maxPiecesPerBag)) {
      setMessage(
        `Esta versão aceita no máximo ${maxPiecesPerBag} peças. Feche a sacola para abrir a próxima versão.`,
      );
      return false;
    }
    const nextItemNo = itemRows.reduce((maxItemNo, row) => Math.max(maxItemNo, row.itemNo), 0) + 1;
    setItemRows((current) => addServiceOrderItemGridRow(current, maxPiecesPerBag));
    focusItemRow(`draft-${nextItemNo}`);
    return true;
  }

  function handleDiscountTab(event: KeyboardEvent<HTMLInputElement>, localId: string) {
    if (event.key !== "Tab" || event.shiftKey) {
      return;
    }
    const lastVisible = visibleItemRows[visibleItemRows.length - 1];
    if (lastVisible?.localId !== localId) {
      return;
    }
    if (!canAddServiceOrderItemGridRow(itemRows, maxPiecesPerBag)) {
      return;
    }
    event.preventDefault();
    addPieceRow();
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
      {!isListWorkspace && !showCreateForm && !selectedOrder ? (
        <section className="hero-card">
          <div className="eyebrow">Operações</div>
          <h1 className="title">Ordem de serviço</h1>
          <p>A Empresa e a Filial vêm do contexto ativo. Abra uma OS na grade ou clique em Nova OS.</p>
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
                { value: "quality", label: "Controle de qualidade" },
                { value: "ready_for_pickup", label: "Pronto para retirada" },
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
          onPay={
            canWriteFinance
              ? (row) => {
                  void openPay(row);
                }
              : undefined
          }
          canPay={(row) => row.status !== "cancelled"}
          rowMenu={buildOsRowMenu}
          records={orders}
          rowLabel={(row) => row.orderNo}
          searchKey="name"
          searchOptions={orderLookupOptions}
          searchPlaceholder="Buscar por número"
          title="Ordens de serviço"
        />
      ) : null}

      {isListWorkspace && payTarget ? (
        <article className="mini-card cadastro-form">
          <OsPayPanel
            orderNo={payTarget.orderNo}
            summary={payTarget.summary}
            onClose={() => setPayTarget(null)}
            onPaid={(summary) => {
              setPayTarget({ orderNo: payTarget.orderNo, summary });
              setPaymentSummary(summary);
              setMessage(
                Number(summary.outstandingBalance) <= 0
                  ? `Pagamento da OS ${payTarget.orderNo} registrado. A OS está quitada.`
                  : `Pagamento parcial da OS ${payTarget.orderNo} registrado.`,
              );
              void loadOrders();
            }}
          />
        </article>
      ) : null}

        {!isListWorkspace ? (
        <article className="mini-card cadastro-form os-form">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar__copy">
              <h3>{showCreateForm ? "Nova OS" : selectedOrder ? `OS ${selectedOrder.orderNo}` : "Ordem de serviço"}</h3>
              <p>
                {showCreateForm
                  ? `Cada linha é uma peça. Cada versão aceita até ${maxPiecesPerBag} peças. Salvar grava rascunho. Fechar sacola só trava.`
                  : selectedOrder?.bagClosed
                    ? `Sacola fechada. Esta versão está travada. Se errou, abra a sacola. Salvar imprime a OP. Se ainda houver peças, marque Abrir nova versão na grade.`
                    : selectedOrder
                      ? `Cada linha é uma peça. Cada versão aceita até ${maxPiecesPerBag} peças. Salvar grava rascunho. Fechar sacola trava; a OP só sai ao salvar depois.`
                      : "Abra uma OS na grade ou cadastre uma nova."}
              </p>
              {!showCreateForm && details?.groupVersions && details.groupVersions.length > 1 ? (
                <p className="table-subtle">
                  Versões ligadas:{" "}
                  {details.groupVersions.map((version, index) => (
                    <span key={version.id}>
                      {index > 0 ? " · " : null}
                      {version.id === selectedOrder?.id ? (
                        <strong>{version.orderNo}</strong>
                      ) : (
                        <button
                          className="button-ghost"
                          onClick={() => {
                            setActiveOrderId(version.id);
                            void loadDetails(version.id);
                          }}
                          type="button"
                        >
                          {version.orderNo}
                        </button>
                      )}
                    </span>
                  ))}
                </p>
              ) : null}
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
                <h4>Cliente</h4>
                <div className="os-client-row">
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
                      required
                      searchPlaceholder="Digite o nome do cliente"
                      value={headerForm.customerId}
                    />
                  </div>
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
              </div>

              <div className="mini-section">
                <h4>Ordem de serviço</h4>
                <div className="os-stack">
                  <div className="os-box">
                    <p className="os-box__title">Identificação</p>
                    <div className="os-id-row">
                      <label className="field">
                        <span>Número</span>
                        <input disabled value={selectedOrder?.orderNo ?? previewOrderNo} />
                      </label>
                      <label className="field">
                        <span>Status</span>
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
                      <div className="field" title="Preenche quando o cliente assina a retirada ou o atendente registra Recebido.">
                        <span>Saída</span>
                        <div className="os-datetime">
                          <input
                            disabled
                            type="date"
                            value={toDateInput(selectedOrder?.actualDeliveryDate)}
                          />
                          <input
                            disabled
                            type="time"
                            value={toTimeInput(selectedOrder?.actualDeliveryTime)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="os-box">
                    <p className="os-box__title">Previsão de entrega</p>
                    <div className="os-forecast-row">
                      <label className="field field--required">
                        <span>Tipo</span>
                        <select
                          disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                          required
                          value={headerForm.deliveryType}
                          onChange={(event) => {
                            const deliveryType = event.target.value as ServiceOrderHeaderForm["deliveryType"];
                            setHeaderForm((current) => ({ ...current, deliveryType }));
                            if (session?.activeBranchId) {
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
                                    promisedDeliveryTime: current.promisedDeliveryTime || nowTimeInput(),
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
                      <label className="field field--required">
                        <span>Data</span>
                        <input
                          disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                          required
                          type="date"
                          value={headerForm.promisedDeliveryDate}
                          onChange={(event) =>
                            setHeaderForm((current) => ({ ...current, promisedDeliveryDate: event.target.value }))
                          }
                        />
                      </label>
                      <label className="field field--required">
                        <span>Horário</span>
                        <input
                          disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                          required
                          type="time"
                          value={headerForm.promisedDeliveryTime}
                          onChange={(event) =>
                            setHeaderForm((current) => ({
                              ...current,
                              promisedDeliveryTime: toTimeInput(event.target.value),
                            }))
                          }
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

                  <div className="os-box">
                    <p className="os-box__title">Responsáveis</p>
                    <div className="os-people-row">
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
                        <span>Qualidade</span>
                        <input
                          disabled
                          placeholder="Ao revisar e aprovar"
                          value={details?.qualityReviewer?.displayName ?? ""}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mini-section os-items-section">
                <div className="workspace-toolbar">
                  <div className="workspace-toolbar__copy">
                    <h4>Serviços e mão de obra</h4>
                    <p>
                      Cada linha é uma peça (quantidade 1). A marca é obrigatória; modelo e série são opcionais. Até {maxPiecesPerBag} peças nesta versão. Fechar trava;
                      Abrir sacola desfaz. Salvar com a sacola fechada imprime a OP.
                    </p>
                  </div>
                </div>

                <div
                  className="data-table-wrapper os-items-table"
                  style={{ ["--os-item-limit" as string]: maxPiecesPerBag }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Serviço</th>
                        <th>Serviço a realizar</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Série</th>
                        <th>Valor</th>
                        <th>Desconto</th>
                        <th>Subtotal</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItemRows.map((row) => {
                        const editable = saving ? false : showCreateForm || row.isEditing;
                        const canMutateRow = showCreateForm || canEditSelectedOrder;
                        return (
                          <tr data-os-item-row={row.localId} key={row.localId}>
                            <td>
                              <SmartLookup
                                compact
                                canCreate={canWrite}
                                createLabel="Cadastrar"
                                disabled={!editable}
                                entityType="products"
                                label="Produto"
                                required
                                onChange={(option) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, {
                                      productId: option?.id ?? "",
                                      itemType: option?.label ?? "",
                                    }),
                                  )
                                }
                                onCreate={(query) => {
                                  const params = new URLSearchParams();
                                  params.set("workspaceMode", "new");
                                  if (query.trim()) params.set("prefillName", query.trim());
                                  const targetPath = `/products?${params.toString()}`;
                                  if (isMobile) {
                                    navigateWithinWorkspace(targetPath);
                                    return;
                                  }
                                  openWorkspaceInNewTab(targetPath, "Produto: Novo", { cloneCurrent: false, subtitle: "Novo cadastro" });
                                }}
                                onOpen={() => {
                                  void loadCatalogs();
                                }}
                                options={productLookupOptions}
                                placeholder="Calça, saia, vestido"
                                searchPlaceholder="Digite o produto"
                                value={row.productId}
                              />
                            </td>
                            <td>
                              <SmartLookup
                                compact
                                canCreate={canWrite}
                                createLabel="Cadastrar"
                                disabled={!editable}
                                entityType="services"
                                label="Serviço"
                                required
                                onChange={(option) => {
                                  const selected = services.find((service) => service.id === option?.id);
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, {
                                      serviceId: option?.id ?? "",
                                      description: option?.label ?? "",
                                      unitPrice: row.unitPrice || formatOsMoneyInput(selected?.defaultPrice),
                                    }),
                                  );
                                }}
                                onCreate={(query) => {
                                  const params = new URLSearchParams();
                                  params.set("workspaceMode", "new");
                                  if (query.trim()) params.set("prefillName", query.trim());
                                  const targetPath = `/services?${params.toString()}`;
                                  if (isMobile) {
                                    navigateWithinWorkspace(targetPath);
                                    return;
                                  }
                                  openWorkspaceInNewTab(targetPath, "Serviço: Novo", { cloneCurrent: false, subtitle: "Novo cadastro" });
                                }}
                                onOpen={() => {
                                  void loadCatalogs();
                                }}
                                options={serviceLookupOptions}
                                placeholder="Bainha, ajuste lateral"
                                searchPlaceholder="Digite o serviço"
                                value={row.serviceId}
                              />
                            </td>
                            <td>
                              <input
                                className="os-item-input"
                                disabled={!editable}
                                placeholder="O que ficou combinado com o cliente"
                                value={row.complement}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { complement: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="os-item-input"
                                disabled={!editable}
                                placeholder="Marca"
                                required
                                value={row.brand}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { brand: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="os-item-input"
                                disabled={!editable}
                                placeholder="Modelo"
                                value={row.model}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { model: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="os-item-input"
                                disabled={!editable}
                                placeholder="Série"
                                value={row.serialNo}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, { serialNo: event.target.value }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="os-item-input os-item-input--money"
                                disabled={!editable}
                                inputMode="numeric"
                                placeholder="0,00"
                                value={row.unitPrice}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, {
                                      unitPrice: applyOsMoneyTyping(event.target.value),
                                    }),
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="os-item-input os-item-input--money"
                                disabled={!editable}
                                inputMode="numeric"
                                placeholder="0,00"
                                value={row.discountValue}
                                onChange={(event) =>
                                  setItemRows((current) =>
                                    updateServiceOrderItemGridRow(current, row.localId, {
                                      discountValue: applyOsMoneyTyping(event.target.value),
                                    }),
                                  )
                                }
                                onKeyDown={(event) => handleDiscountTab(event, row.localId)}
                              />
                            </td>
                            <td>{formatOsMoney(calculateServiceOrderItemSubtotal(row))}</td>
                            <td>
                              <div className="os-item-actions">
                                {canMutateRow ? (
                                  <button
                                    className="button-ghost"
                                    disabled={saving}
                                    onClick={() => {
                                      setItemRows((current) =>
                                        updateServiceOrderItemGridRow(current, row.localId, { isEditing: true }),
                                      );
                                      focusItemRow(row.localId);
                                    }}
                                    type="button"
                                  >
                                    Editar
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
                          <td colSpan={10}>
                            <div className="empty-state">Nenhuma peça na grade. Use Adicionar peça para continuar.</div>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <div className="os-items-footer">
                  {canMutateItems ? (
                    <div className="button-row">
                      <button
                        className="os-add-item"
                        disabled={saving || !canAddServiceOrderItemGridRow(itemRows, maxPiecesPerBag)}
                        onClick={() => {
                          addPieceRow();
                        }}
                        type="button"
                      >
                        + Adicionar peça
                      </button>
                      <button
                        className="button"
                        disabled={saving || visibleItemRows.length === 0}
                        onClick={() => {
                          void handleCloseBag();
                        }}
                        type="button"
                      >
                        Fechar sacola
                      </button>
                    </div>
                  ) : bagClosed && canWrite ? (
                    <div className="button-row">
                      <button
                        className="button"
                        disabled={saving}
                        onClick={() => {
                          void handleOpenBag();
                        }}
                        type="button"
                      >
                        Abrir sacola
                      </button>
                      <button
                        aria-pressed={wantsNextVersion}
                        className={wantsNextVersion ? "button" : "button-secondary"}
                        disabled={saving}
                        onClick={() => setWantsNextVersion((current) => !current)}
                        type="button"
                      >
                        Abrir nova versão
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}
                  <strong className="os-labor-total">Total de mão de obra {formatOsMoney(laborTotal)}</strong>
                </div>
              </div>

              <div className="mini-section">
                <h4>Total da ordem de serviço</h4>
                <div className="os-totals-grid">
                  <label className="field">
                    <span>Mão de obra</span>
                    <input disabled value={formatOsMoney(laborTotal)} />
                  </label>
                  <label className="field">
                    <span>Desconto</span>
                    <input disabled value={formatOsMoney(Math.max(laborTotal - Number(selectedOrder?.totalValue ?? laborTotal), 0))} />
                  </label>
                  <label className="field">
                    <span>Valor total</span>
                    <input disabled value={formatOsMoney(Number(selectedOrder?.totalValue ?? laborTotal))} />
                  </label>
                </div>
              </div>

              <div className="mini-section">
                <h4>Pagamento</h4>
                <div className="os-box">
                  <div className="os-pay-row">
                    <label className="field">
                      <span>Condição</span>
                      <input disabled value={osPaymentConditionLabel(paymentSummary?.paymentStatus)} />
                    </label>
                    <label className="field">
                      <span>Já pago</span>
                      <input disabled value={formatOsMoney(Number(paymentSummary?.amountPaid ?? 0))} />
                    </label>
                    <label className="field">
                      <span>Em aberto</span>
                      <input
                        disabled
                        value={formatOsMoney(
                          Number(paymentSummary?.outstandingBalance ?? selectedOrder?.totalValue ?? laborTotal),
                        )}
                      />
                    </label>
                    {canWriteFinance && selectedOrder ? (
                      <button
                        className="button"
                        disabled={saving || selectedOrder.status === "cancelled"}
                        onClick={() => {
                          void openPay(selectedOrder);
                        }}
                        type="button"
                      >
                        Pagar
                      </button>
                    ) : null}
                  </div>
                </div>
                {selectedOrder && payTarget?.summary.serviceOrderId === selectedOrder.id ? (
                  <OsPayPanel
                    orderNo={selectedOrder.orderNo}
                    summary={payTarget.summary}
                    onClose={() => setPayTarget(null)}
                    onPaid={(summary) => {
                      setPayTarget({ orderNo: selectedOrder.orderNo, summary });
                      setPaymentSummary(summary);
                      setMessage(
                        Number(summary.outstandingBalance) <= 0
                          ? "Pagamento registrado. A OS está quitada."
                          : "Pagamento parcial registrado.",
                      );
                    }}
                  />
                ) : null}
              </div>

              <div className="mini-section">
                <h4>Observação e observação interna</h4>
                <p className="os-rule-banner">
                  A observação sai na OS do cliente. A observação interna não imprime e não vai para a Ordem de Produção.
                </p>
                <div className="os-notes-grid">
                  <label className="field os-note-box">
                    <span>Observação</span>
                    <textarea
                      disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                      rows={5}
                      value={headerForm.customerNotes}
                      onChange={(event) => setHeaderForm((current) => ({ ...current, customerNotes: event.target.value }))}
                    />
                  </label>
                  <label className="field os-note-box os-note-box--internal">
                    <span>Observação interna</span>
                    <textarea
                      disabled={saving || (!showCreateForm && !canEditSelectedOrder)}
                      placeholder="Uso interno, não sai na impressão"
                      rows={5}
                      value={headerForm.commercialNotes}
                      onChange={(event) => setHeaderForm((current) => ({ ...current, commercialNotes: event.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="os-form-footer">
                {selectedOrder && bagClosed && wantsNextVersion ? (
                  <p className="os-rule-banner os-form-footer__notice">
                    Ao salvar, será gerada a nova versão <strong>{nextVersionNo}</strong>. Ela abre em outra aba. Esta OS imprime a OP.
                  </p>
                ) : null}
                <div className="button-row">
                  {showCreateForm ? (
                    <>
                      <button className="button" disabled={saving || !canWrite} type="submit">
                        {saving ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        className="button"
                        disabled={saving || !canWrite || visibleItemRows.length === 0}
                        onClick={() => {
                          void handleCloseBag();
                        }}
                        type="button"
                      >
                        Fechar sacola
                      </button>
                      <button className="button-secondary" onClick={closeServiceOrderWorkspace} type="button">
                        Cancelar
                      </button>
                    </>
                  ) : selectedOrder && bagClosed ? (
                    <>
                      <button className="button" disabled={saving || !canWrite} type="submit">
                        {saving ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        className="button"
                        disabled={saving || !canWrite}
                        onClick={() => {
                          void handleOpenBag();
                        }}
                        type="button"
                      >
                        Abrir sacola
                      </button>
                      <button className="button-secondary" onClick={closeServiceOrderWorkspace} type="button">
                        Cancelar
                      </button>
                      {canWriteFinance ? (
                        <button
                          className="button"
                          disabled={saving || selectedOrder.status === "cancelled"}
                          onClick={() => {
                            void openPay(selectedOrder);
                          }}
                          type="button"
                        >
                          Pagar
                        </button>
                      ) : null}
                      <RowOverflowMenu items={buildOsRowMenu(selectedOrder)} label={`Opções da OS ${selectedOrder.orderNo}`} />
                    </>
                  ) : selectedOrder ? (
                    <>
                      <button className="button" disabled={saving || !canEditSelectedOrder} type="submit">
                        {saving ? "Salvando…" : "Salvar alterações"}
                      </button>
                      <button
                        className="button"
                        disabled={saving || !canEditSelectedOrder || visibleItemRows.length === 0}
                        onClick={() => {
                          void handleCloseBag();
                        }}
                        type="button"
                      >
                        Fechar sacola
                      </button>
                      <button className="button-secondary" onClick={closeServiceOrderWorkspace} type="button">
                        Cancelar
                      </button>
                      {canWriteFinance ? (
                        <button
                          className="button"
                          disabled={saving || selectedOrder.status === "cancelled"}
                          onClick={() => {
                            void openPay(selectedOrder);
                          }}
                          type="button"
                        >
                          Pagar
                        </button>
                      ) : null}
                      <RowOverflowMenu items={buildOsRowMenu(selectedOrder)} label={`Opções da OS ${selectedOrder.orderNo}`} />
                    </>
                  ) : null}
                </div>
                <strong className="os-form-footer__total">{formatOsMoney(Number(selectedOrder?.totalValue ?? laborTotal))}</strong>
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
