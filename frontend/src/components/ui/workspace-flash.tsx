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
  "failed",
  "informe ",
  "revise ",
  "obrigatór",
  "inválid",
  "não encontrado",
  "erro",
];

export function inferFlashTone(message: string): FlashTone {
  const normalized = message.toLowerCase();
  return ERROR_HINTS.some((hint) => normalized.includes(hint)) ? "error" : "ok";
}

export function WorkspaceFlash({ message, tone }: Readonly<{ message: string; tone?: FlashTone }>) {
  const resolved = tone ?? inferFlashTone(message);
  return (
    <section className={`mini-card workspace-flash workspace-flash--${resolved}`} role={resolved === "error" ? "alert" : "status"}>
      <p>{message}</p>
    </section>
  );
}
