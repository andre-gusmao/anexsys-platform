"use client";

import { FormEvent, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { formatOsMoney } from "@/components/service-orders/service-order-workspace-view-model";

export type OsFinancialSummary = {
  serviceOrderId: string;
  orderTotal: string;
  amountPaid: string;
  outstandingBalance: string;
  paymentStatus: "pending" | "partial" | "paid";
};

type Props = {
  orderNo: string;
  summary: OsFinancialSummary;
  onClose: () => void;
  onPaid: (summary: OsFinancialSummary) => void;
};

export function OsPayPanel({ orderNo, summary, onClose, onPaid }: Props) {
  const { apiJson } = useSession();
  const outstanding = Number(summary.outstandingBalance);
  const [amount, setAmount] = useState(outstanding > 0 ? String(outstanding) : "");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe o valor recebido na maquininha ou em dinheiro.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiJson<OsFinancialSummary>("/payments", {
        method: "POST",
        body: JSON.stringify({
          serviceOrderId: summary.serviceOrderId,
          paymentMethod,
          paymentAmount: parsedAmount,
          status: "received",
        }),
      });
      onPaid(response);
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "O pagamento não pôde ser registrado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="os-pay-panel" onSubmit={handleSubmit}>
      <div className="workspace-toolbar__copy">
        <h4>Pagar OS {orderNo}</h4>
        <p>Registra o valor já recebido na maquininha ou em dinheiro. Não processa cartão daqui.</p>
      </div>
      <div className="os-totals-grid">
        <label className="field">
          <span>Total da OS</span>
          <input disabled value={formatOsMoney(Number(summary.orderTotal))} />
        </label>
        <label className="field">
          <span>Já pago</span>
          <input disabled value={formatOsMoney(Number(summary.amountPaid))} />
        </label>
        <label className="field">
          <span>Em aberto</span>
          <input disabled value={formatOsMoney(outstanding)} />
        </label>
      </div>
      <div className="os-header-grid">
        <label className="field">
          <span>Valor recebido</span>
          <input
            inputMode="decimal"
            min="0.01"
            step="0.01"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Forma</span>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "card" | "cash")}>
            <option value="card">Cartão na maquininha</option>
            <option value="cash">Dinheiro</option>
          </select>
        </label>
      </div>
      {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
      <div className="button-row">
        <button className="button" disabled={saving || outstanding <= 0} type="submit">
          {saving ? "Registrando…" : "Registrar pagamento"}
        </button>
        <button className="button-secondary" onClick={onClose} type="button">
          Fechar
        </button>
      </div>
    </form>
  );
}
