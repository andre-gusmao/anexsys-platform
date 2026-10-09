"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  OS_PRINT_CSS,
  buildServiceOrderPrintHtml,
  printServiceOrderDocument,
} from "@/components/service-orders/os-documents";
import {
  describePublicOsError,
  toPublicOsPrintView,
  type PublicOsTrackingView,
} from "@/components/service-orders/public-os-view";

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
    <div className="screen-shell">
      <style>{OS_PRINT_CSS}</style>
      <section className="auth-card public-os">
        {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
        {!view && !error ? <p className="subtitle">Carregando a sua OS…</p> : null}
        {view && printView ? (
          <>
            <div className="auth-card__header">
              <div className="eyebrow">{view.companyName}</div>
              <h1 className="title">Olá, {view.customerFirstName}</h1>
              <p className="subtitle">
                Esta é a ordem de serviço <strong>{view.orderNo}</strong>, igual à via impressa. Não compartilhe este
                link.
              </p>
            </div>
            <div className="auth-card__body">
              <article
                className="public-os__sheet"
                dangerouslySetInnerHTML={{ __html: buildServiceOrderPrintHtml(printView, view.companyName) }}
              />
              <p className="table-subtle">{view.paymentLabel}</p>
              {view.pickedUp ? (
                <p className="os-rule-banner">Retirada confirmada. Obrigada.</p>
              ) : view.recebiReady ? (
                <button className="button" disabled={saving} onClick={() => void confirmRecebi()} type="button">
                  {saving ? "Confirmando…" : "Recebi"}
                </button>
              ) : view.status === "ready_for_pickup" ? (
                <p className="os-rule-banner">Quando estiver no balcão, a atendente libera o botão Recebi neste link.</p>
              ) : (
                <p className="os-rule-banner">Avisaremos por WhatsApp quando estiver pronto. Este link já mostra a OS.</p>
              )}
              <button
                className="button-secondary"
                onClick={() => printServiceOrderDocument(printView, view.companyName)}
                type="button"
              >
                Imprimir / salvar PDF
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
