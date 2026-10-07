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
  serviceOrder: {
    orderNo: string;
    openedAt?: string;
    promisedDeliveryDate?: string;
    promisedDeliveryTime?: string | null;
  };
  customer: {
    legalName: string;
    phone?: string | null;
    email?: string | null;
    cpfCnpj?: string | null;
    street?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  };
  pieceDescription: string | null;
  instructions: string | null;
  items: Array<{
    itemType: string;
    description: string;
    complement?: string | null;
    brand?: string | null;
    model?: string | null;
    serialNo?: string | null;
    rejectionReason?: string | null;
  }>;
  qrCode: { codeValue: string; reissueNo: number } | null;
  version?: { versionNo: number; versionReason: string } | null;
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

const DEFAULT_PRINT_CSS = `
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
`;

export const OP_A5_PRINT_CSS = `
  @page { size: A5 portrait; margin: 8mm; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #162033; background: #fff; }
  .op-sheet {
    box-sizing: border-box;
    width: 148mm;
    min-height: 210mm;
    padding: 8mm;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .op-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .op-company { font-size: 13px; font-weight: 700; margin: 0; }
  .op-entry { font-size: 11px; color: #667085; text-align: right; margin: 0; }
  .op-entry strong { display: block; color: #162033; font-size: 12px; }
  .op-title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin: 0;
    padding: 6px 0;
    border-top: 2px solid #162033;
    border-bottom: 2px solid #162033;
    font-size: 14px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .op-title__no { font-size: 16px; letter-spacing: .04em; font-weight: 800; }
  .op-banner {
    margin: 0;
    padding: 6px 10px;
    border: 1px solid #162033;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
    text-align: center;
  }
  .op-customer { font-size: 12px; margin: 0; }
  .op-customer strong { font-size: 14px; }
  .op-items { width: 100%; border-collapse: collapse; margin: 0; }
  .op-items th {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #1d4ed8;
    text-align: left;
    border-bottom: 1px solid #98a2b3;
    padding: 4px 6px 6px;
  }
  .op-items td {
    font-size: 12px;
    border-bottom: 1px solid #d0d5dd;
    padding: 7px 6px;
    vertical-align: top;
  }
  .op-items th:nth-child(1),
  .op-items td:nth-child(1) { width: 22%; }
  .op-items th:nth-child(2),
  .op-items td:nth-child(2) { width: 20%; }
  .op-items th:nth-child(3),
  .op-items td:nth-child(3) { width: 58%; }
  .op-item__work { font-size: 13px; line-height: 1.35; }
  .op-item__rework {
    display: block;
    margin-top: 4px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
  }
  .op-item__rework-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #667085;
    margin-bottom: 1px;
  }
  .op-item__equip {
    display: block;
    margin-top: 2px;
    font-size: 8px;
    line-height: 1.2;
    color: #98a2b3;
    font-weight: 400;
  }
  .op-pay {
    margin: 4px 0 0;
    padding: 8px 10px;
    border: 1px solid #162033;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .op-shelf {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    padding-top: 10px;
    border-top: 2px solid #162033;
  }
  .op-shelf__label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #667085; }
  .op-shelf__when { display: flex; align-items: flex-end; gap: 4px; line-height: .85; }
  .op-shelf__day { font-size: 92px; font-weight: 900; letter-spacing: -.06em; }
  .op-shelf__month { font-size: 28px; font-weight: 700; padding-bottom: 10px; }
  .op-shelf__qr { text-align: center; }
  .op-shelf__os { display: block; font-size: 20px; font-weight: 800; letter-spacing: .04em; margin-bottom: 6px; }
  .op-shelf__qr img { display: block; width: 28mm; height: 28mm; margin: 0 auto; }
  @media print { body { margin: 0; } }
`;

function writePrintWindow(popup: Window | null, title: string, body: string, css = DEFAULT_PRINT_CSS) {
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
      ${css}
    </style>
  </head>
  <body>
    ${body}
    <script>window.addEventListener("load", function () { window.focus(); window.print(); });</script>
  </body>
</html>`);
  popup.document.close();
}

function openPrintWindow(title: string, body: string, reservedWindow?: Window | null, css?: string) {
  writePrintWindow(reservedWindow === undefined ? reservePrintWindow() : reservedWindow, title, body, css);
}

export function opShelfDateParts(promisedDeliveryDate?: string | null) {
  if (!promisedDeliveryDate) {
    return { day: "—", month: "—" };
  }
  const isoDate = promisedDeliveryDate.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return { day: isoDate.slice(8, 10), month: isoDate.slice(5, 7) };
  }
  const parsed = new Date(promisedDeliveryDate);
  if (Number.isNaN(parsed.getTime())) {
    return { day: "—", month: "—" };
  }
  return {
    day: String(parsed.getDate()).padStart(2, "0"),
    month: String(parsed.getMonth() + 1).padStart(2, "0"),
  };
}

function formatCustomerAddress(customer: OpPrintView["customer"]) {
  return [customer.street, customer.number, customer.city, customer.state, customer.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function buildProductionOrderPrintHtml(
  view: OpPrintView,
  companyName: string,
  paymentCondition = "Pagar na retirada",
) {
  const shelf = opShelfDateParts(view.serviceOrder.promisedDeliveryDate);
  const qr = view.qrCode?.codeValue ?? "";
  const orderNo = view.serviceOrder.orderNo;
  const address = formatCustomerAddress(view.customer);
  const items = view.items
    .map((item) => {
      const equipment = [item.brand, item.model, item.serialNo].map((part) => part?.trim()).filter(Boolean).join(" · ");
      const rejection = item.rejectionReason?.trim();
      return `<tr>
        <td>${escapeHtml(item.itemType)}${equipment ? `<span class="op-item__equip">${escapeHtml(equipment)}</span>` : ""}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="op-item__work">${escapeHtml(item.complement)}${
          rejection
            ? `<span class="op-item__rework"><span class="op-item__rework-label">Refazer</span>${escapeHtml(rejection)}</span>`
            : ""
        }</td>
      </tr>`;
    })
    .join("");

  return `<article class="op-sheet">
    <header class="op-head">
      <p class="op-company">${escapeHtml(companyName)}</p>
      <p class="op-entry">Entrada<strong>${escapeHtml(formatDate(view.serviceOrder.openedAt))}</strong></p>
    </header>
    <h1 class="op-title"><span>Ordem de produção</span><strong class="op-title__no">${escapeHtml(orderNo)}</strong></h1>
    ${
      view.version?.versionReason === "rework"
        ? `<p class="op-banner">Refação · versão ${escapeHtml(String(view.version.versionNo))}</p>`
        : ""
    }
    <p class="op-customer">Cliente: <strong>${escapeHtml(view.customer.legalName)}</strong>
      ${address ? `<br />${escapeHtml(address)}` : ""}
      ${view.customer.phone ? `<br />${escapeHtml(view.customer.phone)}` : ""}
    </p>
    <table class="op-items">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Serviço</th>
          <th>Serviço a realizar</th>
        </tr>
      </thead>
      <tbody>${items}</tbody>
    </table>
    <p class="op-pay">${escapeHtml(paymentCondition)}</p>
    <footer class="op-shelf">
      <div>
        <span class="op-shelf__label">Previsão de entrega</span>
        <div class="op-shelf__when">
          <span class="op-shelf__day">${escapeHtml(shelf.day)}</span>
          <span class="op-shelf__month">/${escapeHtml(shelf.month)}</span>
        </div>
      </div>
      <div class="op-shelf__qr">
        <strong class="op-shelf__os">${escapeHtml(orderNo)}</strong>
        ${
          qr
            ? `<img alt="QR da OS ${escapeHtml(orderNo)}" height="120" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qr)}" width="120" />`
            : ""
        }
      </div>
    </footer>
  </article>`;
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
     <p>Status: ${escapeHtml(osStatusLabel(view.status))} · Tipo: ${escapeHtml(osDeliveryTypeLabel(view.deliveryType))}</p>
     <p>Entrada: ${escapeHtml(formatDateTime(view.openedAt))} · Saída: ${escapeHtml(formatDateTime(view.promisedDeliveryDate, view.promisedDeliveryTime))}</p>
     <table>
       <thead><tr><th>Produto</th><th>Serviço</th><th>Serviço a realizar</th><th>Qtd</th><th>Valor</th><th>Desconto</th><th>Subtotal</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <p class="total">Valor total ${escapeHtml(view.totalValue ? formatOsMoney(Number(view.totalValue)) : "R$ 0,00")}</p>
     ${view.customerNotes ? `<div class="notes"><strong>Observação</strong><br />${escapeHtml(view.customerNotes)}</div>` : ""}`,
    reservedWindow,
  );
}

export function printProductionOrderDocument(
  view: OpPrintView,
  companyName: string,
  reservedWindow?: Window | null,
  paymentCondition = "Pagar na retirada",
) {
  openPrintWindow(
    `OP ${view.serviceOrder.orderNo}`,
    buildProductionOrderPrintHtml(view, companyName, paymentCondition),
    reservedWindow,
    OP_A5_PRINT_CSS,
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
