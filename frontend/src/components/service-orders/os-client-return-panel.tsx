"use client";

import { FormEvent, useMemo, useState } from "react";
import { osClientReturnPreviewCopy } from "@/components/service-orders/service-order-workspace-view-model";

export type ClientReturnItem = {
  id: string;
  itemNo?: number;
  itemType: string;
  description: string;
  complement?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNo?: string | null;
};

type Props = {
  orderNo: string;
  items: ClientReturnItem[];
  maxPiecesPerBag: number;
  preview: {
    kind: string;
    daysSincePickup: number;
    adjustmentPeriodDays: number;
    executionPeriodDays: number;
  } | null;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (itemIds: string[]) => Promise<void> | void;
};

export function OsClientReturnPanel({
  orderNo,
  items,
  maxPiecesPerBag,
  preview,
  saving = false,
  onClose,
  onConfirm,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => items.map((item) => item.id));
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedIds.length;
  const hint = useMemo(
    () => (preview ? osClientReturnPreviewCopy(preview) : "Classifique o retorno a partir da data de retirada."),
    [preview],
  );

  function toggle(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedCount === 0) {
      setError("Selecione pelo menos uma peça para o retorno.");
      return;
    }
    if (selectedCount > maxPiecesPerBag) {
      setError(`Esta versão aceita no máximo ${maxPiecesPerBag} peças. Feche a sacola depois e abra a próxima versão.`);
      return;
    }
    setError(null);
    await onConfirm(selectedIds);
  }

  return (
    <form className="os-pay-panel" onSubmit={(event) => void handleSubmit(event)}>
      <div className="workspace-toolbar__copy">
        <h4>Cliente voltou · OS {orderNo}</h4>
        <p>{hint}</p>
      </div>
      <div className="os-return-items">
        {items.map((item, index) => {
          const equipment = [item.brand, item.model, item.serialNo].map((part) => part?.trim()).filter(Boolean).join(" · ");
          const checked = selectedIds.includes(item.id);
          return (
            <label className="os-return-item" key={item.id}>
              <input
                checked={checked}
                disabled={saving}
                onChange={() => toggle(item.id)}
                type="checkbox"
              />
              <span>
                <strong>
                  S{item.itemNo ?? index + 1} · {item.itemType}
                </strong>
                {` · ${item.description}`}
                {item.complement ? ` · ${item.complement}` : ""}
                {equipment ? <span className="table-subtle">{` · ${equipment}`}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <p className="workspace-flash workspace-flash--error">{error}</p> : null}
      <div className="button-row">
        <button className="button" disabled={saving || selectedCount === 0} type="submit">
          {saving ? "Abrindo…" : "Abrir OS de retorno"}
        </button>
        <button className="button-secondary" disabled={saving} onClick={onClose} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}
