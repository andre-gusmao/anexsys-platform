"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { printServiceOrderDocument } from "@/components/service-orders/os-documents";
import {
  describePublicOsError,
  formatPublicOsDate,
  publicOsCta,
  toPublicOsPrintView,
  type PublicOsTrackingView,
} from "@/components/service-orders/public-os-view";
import { formatOsMoney } from "@/components/service-orders/service-order-workspace-view-model";

async function publicJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/backend-api${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => null)) as { message?: string } | T | null;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Não foi possível abrir esta OS.";
    throw new Error(message);
  }
  return payload as T;
}

function money(value: string | null | undefined) {
  if (value == null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? formatOsMoney(amount) : null;
}

export default function PublicOsPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [view, setView] = useState<PublicOsTrackingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setView(await publicJson<PublicOsTrackingView>(`/public/service-orders/${token}`));
      setError(null);
    } catch (loadError) {
      setView(null);
      setError(describePublicOsError(loadError));
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const printView = useMemo(() => (view ? toPublicOsPrintView(view) : null), [view]);
  const cta = view ? publicOsCta(view) : null;
  const total = view ? money(view.totalValue) : null;

  async function confirmRecebi() {
    setSaving(true);
    try {
      setView(await publicJson<PublicOsTrackingView>(`/public/service-orders/${token}/recebi`, { method: "POST" }));
      setError(null);
    } catch (confirmError) {
      setError(describePublicOsError(confirmError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen-shell public-os-shell">
      <section className="auth-card public-os">
        {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
        {!view && !error ? <p className="subtitle">Carregando a sua OS…</p> : null}
        {view ? (
          <>
            <div className="auth-card__header">
              <div className="eyebrow">{view.companyName}</div>
              <h1 className="title">Olá, {view.customerFirstName}</h1>
              <p className="subtitle">
                OS <strong>{view.orderNo}</strong>. Não compartilhe este link.
              </p>
            </div>
            <div className="auth-card__body">
              <p className="public-os__status">{view.statusLabel}</p>
              <p className="table-subtle">
                Entrada {formatPublicOsDate(view.openedAt)} · Previsão {formatPublicOsDate(view.promisedDeliveryDate)}
                {view.promisedDeliveryTime ? ` ${view.promisedDeliveryTime.slice(0, 5)}` : ""}
              </p>
              <p className="table-subtle">{view.paymentLabel}</p>
              <ul className="public-os__items">
                {view.items.map((item) => {
                  const price = money(item.subtotal ?? item.unitPrice);
                  return (
                    <li key={`${item.itemNo}-${item.description}`}>
                      <strong>
                        {item.itemType} · {item.description}
                      </strong>
                      {item.complement ? <span>{item.complement}</span> : null}
                      {price ? <span className="public-os__price">{price}</span> : null}
                    </li>
                  );
                })}
              </ul>
              {total ? <p className="public-os__total">Total {total}</p> : null}
              {cta === "picked_up" ? <p className="os-rule-banner">Retirada confirmada. Obrigada.</p> : null}
              {cta === "recebi" ? (
                <button className="button public-os__cta" disabled={saving} onClick={() => void confirmRecebi()} type="button">
                  {saving ? "Confirmando…" : "Recebi"}
                </button>
              ) : null}
              {cta === "waiting_counter" ? (
                <p className="os-rule-banner">Quando estiver no balcão, a atendente libera o botão Recebi neste link.</p>
              ) : null}
              {cta === "follow" ? (
                <p className="os-rule-banner">Avisaremos por WhatsApp quando estiver pronto. Você acompanha o status aqui.</p>
              ) : null}
              {printView ? (
                <button
                  className="button-secondary public-os__print"
                  onClick={() => printServiceOrderDocument(printView, view.companyName)}
                  type="button"
                >
                  Ver a via impressa
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
