"use client";

import { FormEvent, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { formatOsInstant } from "@/components/service-orders/os-approval";
import {
  OS_PAYMENT_METHODS,
  osPaymentMethodLabel,
  osShowsFaltaPagamento,
  type OsFinancialSummary,
  type OsPaymentMethod,
} from "@/components/service-orders/os-payment";
import { applyOsMoneyTyping, formatOsMoney, parseOsMoney } from "@/components/service-orders/service-order-workspace-view-model";

export type { OsFinancialSummary };

type Props = {
  orderNo: string;
  summary: OsFinancialSummary;
  onClose: () => void;
  onPaid: (summary: OsFinancialSummary) => void;
};

function toPaySummary(payload: OsFinancialSummary): OsFinancialSummary {
  return {
    serviceOrderId: payload.serviceOrderId,
    orderTotal: payload.orderTotal,
    amountPaid: payload.amountPaid,
    outstandingBalance: payload.outstandingBalance,
    paymentStatus: payload.paymentStatus,
    deliveryBlocked: payload.deliveryBlocked,
    payments: payload.payments ?? [],
  };
}

export function OsPayPanel({ orderNo, summary, onClose, onPaid }: Props) {
  const { apiJson } = useSession();
  const outstanding = Number(summary.outstandingBalance);
  const [amount, setAmount] = useState(outstanding > 0 ? applyOsMoneyTyping(String(Math.round(outstanding * 100))) : "");
  const [paymentMethod, setPaymentMethod] = useState<OsPaymentMethod>("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payments = summary.payments ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = parseOsMoney(amount);
    if (parsedAmount === undefined || parsedAmount <= 0) {
      setError("Informe o valor já recebido no balcão.");
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
      const next = toPaySummary(response);
      setAmount(Number(next.outstandingBalance) > 0 ? applyOsMoneyTyping(String(Math.round(Number(next.outstandingBalance) * 100))) : "");
      onPaid(next);
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "O pagamento não pôde ser registrado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="os-pay-panel" onSubmit={handleSubmit}>
      <div className="workspace-toolbar__copy">
        <h4 id="os-pay-title">Pagar OS {orderNo}</h4>
        <p>Registra o que já entrou no caixa. Não cobra na maquininha e não abre Pix daqui.</p>
      </div>
      {osShowsFaltaPagamento(summary) ? (
        <p className="os-rule-banner">Falta pagamento. Isso não muda o status da OS.</p>
      ) : (
        <p className="table-subtle">OS quitada.</p>
      )}
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
            placeholder="0,00"
            value={amount}
            onChange={(event) => setAmount(applyOsMoneyTyping(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Forma</span>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as OsPaymentMethod)}>
            {OS_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {osPaymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {payments.length > 0 ? (
        <ul className="os-pay-history">
          {payments.map((payment) => (
            <li key={payment.id}>
              <span>
                {osPaymentMethodLabel(payment.paymentMethod)}
                {formatOsInstant(payment.receivedAt) ? ` · ${formatOsInstant(payment.receivedAt)}` : ""}
              </span>
              <strong>{formatOsMoney(Number(payment.paymentAmount))}</strong>
            </li>
          ))}
        </ul>
      ) : null}
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
