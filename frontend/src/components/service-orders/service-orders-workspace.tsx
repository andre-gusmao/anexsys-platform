"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/providers/session-provider";

type ServiceOrderRecord = {
  id: string;
  orderNo: string;
  openedAt: string;
  promisedDeliveryDate: string;
  deliveryType: "Standard" | "Priority" | "Express";
  operationalPriority: string | null;
  status: string;
  totalValue: string | null;
};

type ServiceOrderDetail = {
  serviceOrder: ServiceOrderRecord & {
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function ServiceOrdersWorkspace() {
  const { hasAnyPermission, apiJson } = useSession();
  const canRead = hasAnyPermission("service_orders.read");
  const [orders, setOrders] = useState<ServiceOrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [details, setDetails] = useState<ServiceOrderDetail | null>(null);

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

  const loadDetails = useCallback(async (serviceOrderId: string) => {
    setDetailLoading(true);
    try {
      const response = await apiJson<ServiceOrderDetail>(`/service-orders/${serviceOrderId}`);
      setDetails(response);
      setMessage(null);
    } catch (error) {
      setDetails(null);
      setMessage(error instanceof Error ? error.message : "Os detalhes da Service Order não puderam ser carregados.");
    } finally {
      setDetailLoading(false);
    }
  }, [apiJson]);

  const loadOrders = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const suffix = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
      const response = await apiJson<ServiceOrderRecord[]>(`/service-orders${suffix}`);
      setOrders(response);
      const nextActiveId = activeOrderId && response.some((order) => order.id === activeOrderId) ? activeOrderId : response[0]?.id ?? null;
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
      setMessage(error instanceof Error ? error.message : "As Service Orders não puderam ser carregadas.");
    } finally {
      setLoading(false);
    }
  }, [activeOrderId, apiJson, canRead, loadDetails, searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadOrders]);

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
        <p>Consulte rapidamente as ordens de serviço operacionais do contexto ativo e visualize cliente, itens e datas prometidas.</p>
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
              <p>{loading ? "Carregando…" : `${filteredOrders.length} Service Order(s) visível(is)`}</p>
            </div>
          </div>

          <div className="filters-grid">
            <label className="field">
              <span>Pesquisar</span>
              <input placeholder="Número, status ou prioridade" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="open">Abertas</option>
                <option value="approved">Aprovadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </label>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service Order</th>
                  <th>Entrega</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={order.id === activeOrderId ? "data-table__row--active" : undefined}
                    onClick={() => {
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
                      <div className="empty-state">Nenhuma Service Order encontrada.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="mini-card">
          <div className="workspace-toolbar__copy">
            <h3>Detalhes operacionais</h3>
            <p>{details ? "Cliente, valores e itens vinculados." : "Selecione uma Service Order na grade."}</p>
          </div>

          {detailLoading ? <div className="empty-state">Carregando detalhes…</div> : null}

          {details ? (
            <div className="detail-stack">
              <div className="detail-grid">
                <div className="detail-field">
                  <span>Cliente</span>
                  <strong>{details.customer.legalName}</strong>
                </div>
                <div className="detail-field">
                  <span>Status</span>
                  <strong>{details.serviceOrder.status}</strong>
                </div>
                <div className="detail-field">
                  <span>Entrega prometida</span>
                  <strong>{formatDate(details.serviceOrder.promisedDeliveryDate)}</strong>
                </div>
                <div className="detail-field">
                  <span>Total</span>
                  <strong>{details.serviceOrder.totalValue ?? "—"}</strong>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-field">
                  <span>Telefone</span>
                  <strong>{details.customer.phone ?? "—"}</strong>
                </div>
                <div className="detail-field">
                  <span>Email</span>
                  <strong>{details.customer.email ?? "—"}</strong>
                </div>
                <div className="detail-field">
                  <span>Tipo de entrega</span>
                  <strong>{details.serviceOrder.deliveryType}</strong>
                </div>
                <div className="detail-field">
                  <span>Prazo financeiro</span>
                  <strong>{details.serviceOrder.paymentTermsDays} dia(s)</strong>
                </div>
              </div>

              <div className="mini-section">
                <h4>Itens</h4>
                <ul className="placeholder-list">
                  {details.items.map((item) => (
                    <li key={item.id}>
                      <strong>#{item.itemNo}</strong> · {item.description} · {item.quantity}
                      {item.unitPrice ? ` · ${item.unitPrice}` : ""} · {item.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-state">Selecione uma Service Order para visualizar os detalhes.</div>
          )}
        </article>
      </section>
    </>
  );
}
