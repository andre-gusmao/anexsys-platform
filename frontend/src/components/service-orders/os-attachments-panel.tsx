"use client";

import { approvalMethodLabel, formatOsInstant, type ApprovalSummary } from "@/components/service-orders/os-approval";
import { pickupMethodLabel, type PickupSummary } from "@/components/service-orders/os-pickup";

type Props = {
  orderNo: string;
  approval: ApprovalSummary | null;
  approvalPhoto: string | null;
  pickup: PickupSummary | null;
  pickupPhoto: string | null;
  onClose: () => void;
};

function AttachmentCard({
  title,
  caption,
  photo,
  photoAlt,
  empty,
}: {
  title: string;
  caption: string;
  photo: string | null;
  photoAlt: string;
  empty: string;
}) {
  return (
    <section className="os-attachment-card">
      <h5>{title}</h5>
      <p className="table-subtle">{caption}</p>
      {photo ? <img alt={photoAlt} className="os-pickup-photo" src={photo} /> : <p className="table-subtle">{empty}</p>}
    </section>
  );
}

export function OsAttachmentsPanel({ orderNo, approval, approvalPhoto, pickup, pickupPhoto, onClose }: Props) {
  const approvalWhen = formatOsInstant(approval?.confirmedAt);
  const pickupWhen = formatOsInstant(pickup?.confirmedAt);
  const approvalCaption = [
    approvalWhen,
    approvalMethodLabel(approval?.method),
    approval?.signed ? approval?.acceptedText : approval?.releaseReason,
  ]
    .filter(Boolean)
    .join(" · ");
  const pickupCaption = [pickupWhen, pickupMethodLabel(pickup?.method), pickup?.acceptedText].filter(Boolean).join(" · ");

  return (
    <div className="os-pay-panel">
      <div className="workspace-toolbar__copy">
        <h4>Anexos · OS {orderNo}</h4>
        <p>
          Duas categorias: a OS assinada no papel do <strong>serviço aprovado</strong> e a OP assinada na{" "}
          <strong>retirada</strong>.
        </p>
      </div>
      <div className="os-attachments">
        <AttachmentCard
          title="Serviço aprovado"
          caption={approvalCaption || "Ainda sem aprovação registrada."}
          photo={approvalPhoto}
          photoAlt="OS assinada no papel"
          empty={
            approval?.signed && approval.method === "counter"
              ? "Assinado no balcão, sem foto."
              : "Sem OS assinada no papel."
          }
        />
        <AttachmentCard
          title="Retirada"
          caption={pickupCaption || "Ainda sem retirada registrada."}
          photo={pickupPhoto}
          photoAlt="OP assinada na retirada"
          empty={
            pickup?.method === "attendant" || pickup?.method === "link"
              ? "Retirada sem foto da OP."
              : "Sem OP assinada na retirada."
          }
        />
      </div>
      <div className="button-row">
        <button className="button-secondary" onClick={onClose} type="button">
          Fechar
        </button>
      </div>
    </div>
  );
}
