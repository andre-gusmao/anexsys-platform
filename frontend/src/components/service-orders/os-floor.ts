export type FloorAction = "pick_up" | "finish_production" | "open_review" | "pick_up_rework" | "finish_rework";

export function nextFloorAction(status: string, bagClosed: boolean): FloorAction | null {
  if (!bagClosed || status === "cancelled" || status === "ready_for_pickup") {
    return null;
  }
  if (status === "open" || status === "approved") {
    return "pick_up";
  }
  if (status === "in_production") {
    return "finish_production";
  }
  if (status === "awaiting_quality") {
    return "open_review";
  }
  if (status === "quality") {
    return "pick_up_rework";
  }
  if (status === "in_rework") {
    return "finish_rework";
  }
  return null;
}

export function floorActionLabel(action: FloorAction) {
  if (action === "pick_up") return "Pegar sacola";
  if (action === "finish_production") return "Terminei";
  if (action === "open_review") return "Abrir revisão";
  if (action === "pick_up_rework") return "Pegar refação";
  return "Terminei a refação";
}

export function floorActionHint(action: FloorAction) {
  if (action === "pick_up") return "Passo provisório até o QR: a técnica pega a sacola e a OS vai para Em produção.";
  if (action === "finish_production") return "Passo provisório até o QR: a técnica terminou e a OS vai para Aguardando controle de qualidade.";
  if (action === "open_review") return "Passo provisório até o QR: o revisor tira a sacola da esteira e abre o Controle de qualidade.";
  if (action === "pick_up_rework") return "Passo provisório até o QR: a técnica pega as peças reprovadas para refação.";
  return "Passo provisório até o QR: a refação terminou e a OS volta para Aguardando controle de qualidade.";
}

export function floorActionSuccessMessage(action: FloorAction, orderNo: string) {
  if (action === "pick_up") return `OS ${orderNo} em produção. Quando terminar, clique em Terminei.`;
  if (action === "finish_production") return `OS ${orderNo} aguardando controle de qualidade.`;
  if (action === "open_review") return `OS ${orderNo} em Controle de qualidade. Revise peça a peça.`;
  if (action === "pick_up_rework") return `OS ${orderNo} em refação. Quando terminar, clique em Terminei a refação.`;
  return `OS ${orderNo} voltou para Aguardando controle de qualidade.`;
}

export function canRunFloorAction(
  action: FloorAction,
  permissions: { canWriteOs: boolean; canWriteProduction: boolean; canWriteQuality: boolean },
) {
  if (action === "open_review") {
    return permissions.canWriteOs || permissions.canWriteQuality;
  }
  return permissions.canWriteOs || permissions.canWriteProduction;
}

export function canReopenBagAfterFloor(status: string) {
  return status === "open" || status === "approved";
}
