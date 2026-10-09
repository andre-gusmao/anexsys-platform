"use client";

import { FormEvent, useState } from "react";
import { approvalMethodLabel, type ApprovalSummary } from "@/components/service-orders/os-approval";

type Props = {
  orderNo: string;
  approval: ApprovalSummary | null;
  saving?: boolean;
  onClose: () => void;
  onComplete: (input: {
    method: "counter" | "paper" | "release";
    photo?: { mimeType: string; contentBase64: string; fileName: string } | null;
    releaseReason?: string;
  }) => Promise<void> | void;
};

async function readPhoto(file: File): Promise<{ mimeType: string; contentBase64: string; fileName: string }> {
  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = () => reject(new Error("A foto da OS assinada não pôde ser lida."));
    reader.readAsDataURL(file);
  });
  return { mimeType: file.type || "image/jpeg", contentBase64, fileName: file.name };
}

export function OsApprovalPanel({ orderNo, approval, saving = false, onClose, onComplete }: Props) {
  const [photo, setPhoto] = useState<{ mimeType: string; contentBase64: string; fileName: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [releaseReason, setReleaseReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signed = Boolean(approval?.signed);
  const released = Boolean(approval?.releasedWithoutSignature);

  async function handleFile(file: File | undefined) {
    if (!file) {
      setPhoto(null);
      setPreview(null);
      return;
    }
    try {
      const next = await readPhoto(file);
      setPhoto(next);
      setPreview(`data:${next.mimeType};base64,${next.contentBase64}`);
      setError(null);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "A foto não pôde ser lida.");
    }
  }

  async function handlePaper(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signed) {
      return;
    }
    if (!photo) {
      setError("Anexe a foto da OS assinada para registrar no papel.");
      return;
    }
    await onComplete({ method: "paper", photo });
  }

  return (
    <form className="os-pay-panel" onSubmit={(event) => void handlePaper(event)}>
      <div className="workspace-toolbar__copy">
        <h4>Aprovação · OS {orderNo}</h4>
        <p>
          O cliente concorda com o <strong>serviço e o valor</strong>. A OS continua <strong>Em aberto</strong>. A
          medida usada fica travada. O Concordo no celular entra depois, no mesmo link.
        </p>
      </div>
      {signed ? (
        <p className="table-subtle">
          Assinado
          {approval?.method ? ` · ${approvalMethodLabel(approval.method)}` : ""}
          {approval?.acceptedText ? ` · ${approval.acceptedText}` : ""}
        </p>
      ) : released ? (
        <p className="table-subtle">
          Produção liberada sem assinatura
          {approval?.releaseReason ? ` · ${approval.releaseReason}` : ""}. Ainda pode assinar no balcão ou no papel.
        </p>
      ) : (
        <p className="table-subtle">Ainda não há assinatura nesta OS.</p>
      )}
      {!signed ? (
        <>
          <label className="field">
            <span>Foto da OS assinada</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
              }}
              type="file"
            />
          </label>
          {preview ? <img alt="Foto da OS assinada" className="os-pickup-photo" src={preview} /> : null}
          <label className="field">
            <span>Motivo para produzir sem assinatura</span>
            <textarea
              disabled={saving}
              placeholder="Obrigatório só na liberação"
              rows={3}
              value={releaseReason}
              onChange={(event) => setReleaseReason(event.target.value)}
            />
          </label>
        </>
      ) : null}
      {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
      <div className="button-row">
        {!signed ? (
          <>
            <button
              className="button"
              disabled={saving}
              onClick={() => void onComplete({ method: "counter" })}
              type="button"
            >
              {saving ? "Registrando…" : "Concordou"}
            </button>
            <button className="button" disabled={saving || !photo} type="submit">
              {saving ? "Registrando…" : "Assinado no papel"}
            </button>
            {!released ? (
              <button
                className="button-secondary"
                disabled={saving}
                onClick={() => {
                  if (releaseReason.trim().length < 3) {
                    setError("Informe o motivo para liberar a produção sem assinatura.");
                    return;
                  }
                  void onComplete({ method: "release", releaseReason: releaseReason.trim() });
                }}
                type="button"
              >
                Liberar produção
              </button>
            ) : null}
          </>
        ) : null}
        <button className="button-secondary" disabled={saving} onClick={onClose} type="button">
          {signed ? "Fechar" : "Cancelar"}
        </button>
      </div>
    </form>
  );
}
