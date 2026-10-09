export const PICKUP_WINDOW_MINUTES = 10;

export type PickupMethod = "paper" | "attendant" | "link";

export type PickupSummary = {
  windowOpen?: boolean;
  windowOpenedAt?: string | Date | null;
  windowExpiresAt?: string | Date | null;
  method?: PickupMethod | null;
  confirmedAt?: string | Date | null;
  customerPhone?: string | null;
  recipientName?: string | null;
  acceptedText?: string | null;
  photoAvailable?: boolean;
  recebiReady?: boolean;
  partial?: boolean;
};

export function pickupMethodLabel(method: string | null | undefined) {
  if (method === "paper") return "Papel";
  if (method === "attendant") return "Atendente";
  if (method === "link") return "Link do cliente";
  return null;
}

export function formatPickupWindow(expiresAt?: string | Date | null) {
  if (!expiresAt) return "";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}
