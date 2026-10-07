import { osDeliveryTypeLabel, osStatusLabel } from "./os-list";
import { formatOsMoney } from "./service-order-workspace-view-model";

export type OsPrintView = {
  documentType: "service_order";
  serviceOrderId: string;
  orderNo: string;
  status: string;
  openedAt: string;
  promisedDeliveryDate: string;
  promisedDeliveryTime?: string | null;
  deliveryType: "Standard" | "Priority" | "Express";
  customer: {
    legalName: string;
    phone: string | null;
    email: string | null;
  };
  items: Array<{
    productName: string;
    serviceName: string;
    complement: string | null;
    quantity: string;
    unitPrice: string | null;
    discountValue: string | null;
    subtotal: string | null;
  }>;
  totalValue: string | null;
  customerNotes: string | null;
};

export type OpPrintView = {
  productionNo: string;
  serviceOrder: { orderNo: string };
  customer: { legalName: string };
  pieceDescription: string | null;
  instructions: string | null;
  items: Array<{
    itemType: string;
    description: string;
    complement?: string | null;
    quantity: string;
  }>;
  qrCode: { codeValue: string; reissueNo: number } | null;
};

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(dateValue: string | null | undefined, timeValue?: string | null) {
  const date = formatDate(dateValue);
  if (timeValue && /^\d{2}:\d{2}/.test(timeValue)) {
    return `${date} ${timeValue.slice(0, 5)}`;
  }
  return date;
}

export function reservePrintWindow() {
  if (typeof window === "undefined") {
    return null;
  }
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) {
    return null;
  }
  popup.opener = null;
  popup.document.write("<!doctype html><title>Preparando impressão…</title><body><p>Preparando a Ordem de Produção…</p></body>");
  popup.document.close();
  return popup;
}

function writePrintWindow(popup: Window | null, title: string, body: string) {
  if (!popup) {
    throw new Error(
      "O navegador bloqueou a janela de impressão. Permita pop-ups para este site e reimprima a OP pelo menu ⋮.",
    );
  }
  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #162033; margin: 24px; }
      h1 { font-size: 22px; margin: 0 0 6px; }
      p, td, th { font-size: 13px; }
      .muted { color: #667085; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border-bottom: 1px solid #d7dfeb; text-align: left; padding: 8px 6px; vertical-align: top; }
      th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #667085; }
      .total { font-size: 18px; text-align: right; }
      .notes { border: 1px solid #d7dfeb; padding: 12px; white-space: pre-wrap; }
      .qr { margin-top: 24px; text-align: center; }
      .qr strong { display: block; font-size: 20px; letter-spacing: .08em; margin-top: 8px; }
      @media print { button { display: none; } body { margin: 12px; } }
    </style>
  </head>
  <body>
    ${body}
    <script>window.addEventListener("load", function () { window.focus(); window.print(); });</script>
  </body>
</html>`);
  popup.document.close();
}

function openPrintWindow(title: string, body: string, reservedWindow?: Window | null) {
  writePrintWindow(reservedWindow === undefined ? reservePrintWindow() : reservedWindow, title, body);
}

export function printServiceOrderDocument(view: OsPrintView, companyName: string, reservedWindow?: Window | null) {
  const rows = view.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.productName)}</td>
        <td>${escapeHtml(item.serviceName)}</td>
        <td>${escapeHtml(item.complement)}</td>
        <td>${escapeHtml(item.quantity)}</td>
        <td>${item.unitPrice ? escapeHtml(formatOsMoney(Number(item.unitPrice))) : "—"}</td>
        <td>${item.discountValue ? escapeHtml(formatOsMoney(Number(item.discountValue))) : "—"}</td>
        <td>${item.subtotal ? escapeHtml(formatOsMoney(Number(item.subtotal))) : "—"}</td>
      </tr>`,
    )
    .join("");

  openPrintWindow(
    `OS ${view.orderNo}`,
    `<p class="muted">${escapeHtml(companyName)}</p>
     <h1>Ordem de serviço ${escapeHtml(view.orderNo)}</h1>
     <p>Cliente: <strong>${escapeHtml(view.customer.legalName)}</strong></p>
     <p>Situação: ${escapeHtml(osStatusLabel(view.status))} · Tipo: ${escapeHtml(osDeliveryTypeLabel(view.deliveryType))}</p>
     <p>Entrada: ${escapeHtml(formatDateTime(view.openedAt))} · Saída: ${escapeHtml(formatDateTime(view.promisedDeliveryDate, view.promisedDeliveryTime))}</p>
     <table>
       <thead><tr><th>Produto</th><th>Serviço</th><th>Complemento</th><th>Qtd</th><th>Valor</th><th>Desconto</th><th>Subtotal</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <p class="total">Valor total ${escapeHtml(view.totalValue ? formatOsMoney(Number(view.totalValue)) : "R$ 0,00")}</p>
     ${view.customerNotes ? `<div class="notes"><strong>Observação</strong><br />${escapeHtml(view.customerNotes)}</div>` : ""}`,
    reservedWindow,
  );
}

export function printProductionOrderDocument(view: OpPrintView, companyName: string, reservedWindow?: Window | null) {
  const rows = view.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.itemType)}</td>
        <td>${escapeHtml(item.description)}</td>
        <td>${escapeHtml(item.complement)}</td>
        <td>${escapeHtml(item.quantity)}</td>
      </tr>`,
    )
    .join("");
  const qr = view.qrCode?.codeValue ?? "";

  openPrintWindow(
    `OP ${view.productionNo}`,
    `<p class="muted">${escapeHtml(companyName)}</p>
     <h1>Ordem de produção ${escapeHtml(view.productionNo)}</h1>
     <p>OS ${escapeHtml(view.serviceOrder.orderNo)} · Cliente: <strong>${escapeHtml(view.customer.legalName)}</strong></p>
     <p>Este documento não mostra valores. É o papel da sacola para o técnico.</p>
     <table>
       <thead><tr><th>Produto</th><th>Serviço</th><th>Complemento</th><th>Qtd</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     ${view.pieceDescription ? `<p>${escapeHtml(view.pieceDescription)}</p>` : ""}
     ${qr ? `<div class="qr"><img alt="QR da OS" height="180" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qr)}" width="180" /><strong>${escapeHtml(qr)}</strong></div>` : ""}`,
    reservedWindow,
  );
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function toWhatsAppPhone(phone: string | null | undefined) {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function buildOsWhatsAppMessage(input: {
  customerName: string;
  companyName: string;
  orderNo: string;
}) {
  return `Olá, ${firstName(input.customerName)}, aqui é do ${input.companyName}, você está recebendo a sua ordem de serviço digital ${input.orderNo}, acompanhe o status de produção, mas fique tranquila que por este canal avisaremos quando estiver pronto, entre agora para aprovar o que ficou combinado.`;
}

export function openWhatsAppResend(phone: string | null | undefined, message: string) {
  const target = toWhatsAppPhone(phone);
  if (!target) {
    throw new Error("O cliente não tem WhatsApp cadastrado para reenviar a OS.");
  }
  window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

export function openEmailResend(email: string | null | undefined, subject: string, body: string) {
  if (!email?.trim()) {
    throw new Error("O cliente não tem e-mail cadastrado para reenviar a OS.");
  }
  window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
