"use client";

import { FormEvent, useState } from "react";
import { PROOF_NOTE_MAX_CHARS } from "@/components/service-orders/os-proof";

export type ProofNoteItem = {
  id: string;
  itemNo?: number;
  itemType: string;
  description: string;
  complement?: string | null;
};

type Props = {
  orderNo: string;
  items: ProofNoteItem[];
  saving?: boolean;
  onClose: () => void;
  onConfirm: (notes: Array<{ itemId: string; note: string }>) => Promise<void> | void;
};

export function OsProofNotesPanel({ orderNo, items, saving = false, onClose, onConfirm }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});

  function setNote(itemId: string, note: string) {
    setNotes((current) => ({ ...current, [itemId]: note.slice(0, PROOF_NOTE_MAX_CHARS) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = items
      .map((item) => ({ itemId: item.id, note: (notes[item.id] ?? "").trim() }))
      .filter((row) => row.note.length > 0);
    await onConfirm(payload);
  }

  return (
    <form className="os-pay-panel" onSubmit={(event) => void handleSubmit(event)}>
      <div className="workspace-toolbar__copy">
        <h4>Anotações de prova · OS {orderNo}</h4>
        <p>
          Nova medição depois do corte. O texto é opcional e fica no histórico da peça. Se anotar, a mesma OP é
          reimpressa com o marcador Prova. Sem texto, a OS só volta para produção.
        </p>
      </div>
      <div className="os-return-items">
        {items.map((item, index) => {
          const value = notes[item.id] ?? "";
          return (
            <label className="os-return-item os-proof-note" key={item.id}>
              <span>
                <strong>
                  S{item.itemNo ?? index + 1} · {item.itemType}
                </strong>
                {` · ${item.description}`}
                {item.complement ? ` · ${item.complement}` : ""}
                <textarea
                  disabled={saving}
                  maxLength={PROOF_NOTE_MAX_CHARS}
                  onChange={(event) => setNote(item.id, event.target.value)}
                  placeholder="Ajuste da prova (opcional)"
                  rows={3}
                  value={value}
                />
                <span className="table-subtle">
                  {value.trim().length}/{PROOF_NOTE_MAX_CHARS}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <div className="button-row">
        <button className="button" disabled={saving} type="submit">
          {saving ? "Registrando…" : "Prova feita"}
        </button>
        <button className="button-secondary" disabled={saving} onClick={onClose} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}
