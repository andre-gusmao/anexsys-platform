import { PaymentDirection, PaymentMethod, PaymentProviderName, PaymentRecordStatus } from 'src/shared/domain/enums';

export interface CreatePaymentAllocationDto {
  serviceOrderItemId?: string | null;
  allocatedAmount: number;
}

export interface CreatePaymentDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  paymentReferenceNo?: string | null;
  paymentMethod: PaymentMethod;
  paymentProvider?: PaymentProviderName | null;
  paymentDirection?: PaymentDirection;
  paymentAmount: number;
  receivedAt?: string | null;
  authorizedAt?: string | null;
  reconciledAt?: string | null;
  status?: PaymentRecordStatus;
  allocations?: CreatePaymentAllocationDto[];
}
