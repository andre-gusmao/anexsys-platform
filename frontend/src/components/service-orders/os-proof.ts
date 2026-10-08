export type ProofAction = "send_to_proof" | "complete_proof" | "resume_from_proof";

export function canSendToProof(status: string, bagClosed: boolean): boolean {
  return Boolean(bagClosed) && status === "in_production";
}

export function canActOnProof(status: string): boolean {
  return status === "awaiting_proof";
}

export function proofActionLabel(action: ProofAction) {
  if (action === "send_to_proof") return "Enviar para prova";
  if (action === "complete_proof") return "Prova feita";
  return "Continuar produção";
}

export function proofActionSuccessMessage(action: ProofAction, orderNo: string) {
  if (action === "send_to_proof") {
    return `OS ${orderNo} aguardando prova. A mesma OP permanece na sacola.`;
  }
  if (action === "complete_proof") {
    return `OS ${orderNo} foi para Aguardando controle de qualidade. A versão da OP não mudou.`;
  }
  return `OS ${orderNo} voltou para produção na mesma OP. Quando terminar, clique em Terminei.`;
}
