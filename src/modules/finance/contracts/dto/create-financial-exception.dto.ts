import { FinancialExceptionType } from 'src/shared/domain/enums';

export interface CreateFinancialExceptionDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  paymentRecordId?: string | null;
  exceptionType: FinancialExceptionType;
  reason: string;
  amountImpact?: number | null;
  openedAt?: string | null;
}
