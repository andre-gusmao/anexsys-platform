"use client";

import { FormEvent, useState } from "react";
import { formatPickupWindow, type PickupSummary } from "@/components/service-orders/os-pickup";
import { osShowsFaltaPagamento, type OsFinancialSummary } from "@/components/service-orders/os-payment";
import { readOsPhotoFile } from "@/components/service-orders/os-photo";

type Props = {
  orderNo: string;
  pickup: PickupSummary | null;
  payment?: OsFinancialSummary | null;
  saving?: boolean;
  onClose: () => void;
  onCopyLink?: () => Promise<void> | void;
  onStart: () => Promise<void> | void;
  onComplete: (input: {
    method: "paper" | "attendant";
    photo?: { mimeType: string; contentBase64: string; fileName: string } | null;
  }) => Promise<void> | void;
};

export function OsPickupPanel({
  orderNo,
  pickup,
  payment = null,
  saving = false,
  onClose,
  onCopyLink,
  onStart,
  onComplete,
}: Props) {
  const [photo, setPhoto] = useState<{ mimeType: string; contentBase64: string; fileName: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const windowLabel = formatPickupWindow(pickup?.windowExpiresAt ?? null);

  async function handleFile(file: File | undefined) {
    if (!file) {
      setPhoto(null);
      setPreview(null);
      return;
    }
    try {
      const next = await readOsPhotoFile(file, "A foto da OP assinada não pôde ser lida.");
      setPhoto(next);
      setPreview(`data:${next.mimeType};base64,${next.contentBase64}`);
      setError(null);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "A foto não pôde ser lida.");
    }
  }

  async function handlePaper(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) {
      setError("Anexe a foto da OP assinada para entregar no papel.");
      return;
    }
    await onComplete({ method: "paper", photo });
  }

  return (
    <form className="os-pay-panel" onSubmit={(event) => void handlePaper(event)}>
      <div className="workspace-toolbar__copy">
        <h4>Retirada · OS {orderNo}</h4>
        <p>
          Inicie a retirada para habilitar o <strong>Recebi</strong> no link do cliente. A API do WhatsApp entra
          depois; o mesmo link já fica pronto. Sem clique do cliente, use o papel ou o Entregue do atendente.
        </p>
      </div>
      {osShowsFaltaPagamento(payment) ? (
        <p className="os-rule-banner">
          Falta pagamento. Isso não muda o status da OS
          {payment?.deliveryBlocked ? " e a entrega fica bloqueada até quitar ou o gerente liberar (depois)." : "."}
        </p>
      ) : null}
      <p className="table-subtle">
        {pickup?.windowOpen
          ? `Janela aberta até ${windowLabel}. O Recebi no link já pode confirmar.`
          : "A janela do cliente ainda não foi aberta."}
      </p>
      <div className="button-row">
        <button className="button" disabled={saving} onClick={() => void onStart()} type="button">
          {saving ? "Abrindo…" : pickup?.windowOpen ? "Renovar janela" : "Iniciar retirada"}
        </button>
        {onCopyLink ? (
          <button className="button-secondary" disabled={saving} onClick={() => void onCopyLink()} type="button">
            Copiar link do cliente
          </button>
        ) : null}
      </div>
      <label className="field">
        <span>Foto da OP assinada</span>
        <input
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
          }}
          type="file"
        />
      </label>
      {preview ? <img alt="Foto da OP assinada" className="os-pickup-photo" src={preview} /> : null}
      {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
      <div className="button-row">
        <button className="button" disabled={saving || !photo || Boolean(payment?.deliveryBlocked)} type="submit">
          {saving ? "Registrando…" : "Entregue assinado"}
        </button>
        <button
          className="button-secondary"
          disabled={saving || Boolean(payment?.deliveryBlocked)}
          onClick={() => void onComplete({ method: "attendant" })}
          type="button"
        >
          Entregue
        </button>
        <button className="button-secondary" disabled={saving} onClick={onClose} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}
