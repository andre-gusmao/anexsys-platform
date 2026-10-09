"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type PublicTrackingView = {
  orderNo: string;
  companyName: string;
  customerFirstName: string;
  status: string;
  statusLabel: string;
  openedAt: string;
  promisedDeliveryDate: string;
  promisedDeliveryTime?: string | null;
  items: Array<{ itemNo: number; itemType: string; description: string; complement?: string | null }>;
  recebiReady: boolean;
  pickedUp: boolean;
  pickupMethod?: string | null;
  paymentLabel: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

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

export default function PublicOsPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [view, setView] = useState<PublicTrackingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setView(await publicJson<PublicTrackingView>(`/public/service-orders/${token}`));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Este link não foi encontrado.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmRecebi() {
    setSaving(true);
    try {
      setView(await publicJson<PublicTrackingView>(`/public/service-orders/${token}/recebi`, { method: "POST" }));
      setError(null);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "A retirada não pôde ser confirmada.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen-shell">
      <section className="auth-card public-os">
        {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
        {!view && !error ? <p className="subtitle">Carregando a sua OS…</p> : null}
        {view ? (
          <>
            <div className="auth-card__header">
              <div className="eyebrow">{view.companyName}</div>
              <h1 className="title">Olá, {view.customerFirstName}</h1>
              <p className="subtitle">
                Acompanhe a OS <strong>{view.orderNo}</strong> por este link. Não compartilhe com outras pessoas.
              </p>
            </div>
            <div className="auth-card__body">
              <p className="public-os__status">{view.statusLabel}</p>
              <p className="table-subtle">
                Entrada {formatDate(view.openedAt)} · Previsão {formatDate(view.promisedDeliveryDate)}
                {view.promisedDeliveryTime ? ` ${view.promisedDeliveryTime.slice(0, 5)}` : ""}
              </p>
              <p className="table-subtle">{view.paymentLabel}</p>
              <ul className="public-os__items">
                {view.items.map((item) => (
                  <li key={`${item.itemNo}-${item.description}`}>
                    <strong>
                      S{item.itemNo} · {item.itemType}
                    </strong>
                    {` · ${item.description}`}
                    {item.complement ? ` · ${item.complement}` : ""}
                  </li>
                ))}
              </ul>
              {view.pickedUp ? (
                <p className="os-rule-banner">Retirada confirmada. Obrigada.</p>
              ) : view.recebiReady ? (
                <button className="button" disabled={saving} onClick={() => void confirmRecebi()} type="button">
                  {saving ? "Confirmando…" : "Recebi"}
                </button>
              ) : view.status === "ready_for_pickup" ? (
                <p className="os-rule-banner">Quando estiver no balcão, a atendente libera o botão Recebi neste link.</p>
              ) : (
                <p className="os-rule-banner">Avisaremos por WhatsApp quando estiver pronto. Este link já mostra o status.</p>
              )}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
