export function publicOsStatusLabel(status: string): string {
  if (status === 'open' || status === 'approved') {
    return 'Em aberto';
  }
  if (status === 'in_production') {
    return 'Em produção';
  }
  if (status === 'awaiting_proof') {
    return 'Aguardando prova';
  }
  if (status === 'awaiting_quality' || status === 'quality' || status === 'in_rework') {
    return 'Controle de qualidade';
  }
  if (status === 'ready_for_pickup') {
    return 'Pronto para retirada';
  }
  if (status === 'picked_up') {
    return 'Retirado';
  }
  if (status === 'cancelled') {
    return 'Cancelada';
  }
  return 'Em aberto';
}

export function publicCustomerFirstName(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? '').trim();
  return trimmed.split(/\s+/)[0] || 'Cliente';
}
