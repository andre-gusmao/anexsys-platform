"use client";

export type FlashTone = "error" | "ok";

const ERROR_HINTS = [
  "não pôde",
  "não foi",
  "não foram",
  "não é possível",
  "não foi possível",
  "já existe",
  "already exists",
  "could not",
  "cannot read",
  "undefined",
  "typeerror",
  "internal server",
  "failed",
  "informe ",
  "revise ",
  "obrigatór",
  "inválid",
  "não encontrado",
  "erro",
];

const SUCCESS_HINTS = [
  "com sucesso",
  "criada.",
  "criado.",
  "atualizada.",
  "atualizado.",
  "atualizados.",
  "nasceu junto",
  "foi inativad",
  "foi excluíd",
  "foram excluíd",
  "vinculad",
  "reativada",
  "ativada.",
  "desativada.",
  "selecionada automaticamente",
  "já está no contexto",
  "successfully",
  "saved.",
  "were persisted",
  "recorded successfully",
];

const DEV_RESTART_HINT =
  /cannot read properties of undefined|getAllAndOverride|assertAllowed|internal server error/i;

export function inferFlashTone(message: string): FlashTone {
  const normalized = message.toLowerCase();
  if (ERROR_HINTS.some((hint) => normalized.includes(hint))) {
    return "error";
  }
  if (SUCCESS_HINTS.some((hint) => normalized.includes(hint))) {
    return "ok";
  }
  return "error";
}

export function describeWorkspaceError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : "";
  if (DEV_RESTART_HINT.test(raw)) {
    return `${fallback.replace(/\.$/, "")}. Pare o processo da porta 3000, rode npm run start:dev outra vez e tente de novo.`;
  }
  return raw || fallback;
}

export function WorkspaceFlash({ message, tone }: Readonly<{ message: string; tone?: FlashTone }>) {
  const resolved = tone ?? inferFlashTone(message);
  return (
    <section className={`mini-card workspace-flash workspace-flash--${resolved}`} role={resolved === "error" ? "alert" : "status"}>
      <p>{message}</p>
    </section>
  );
}
