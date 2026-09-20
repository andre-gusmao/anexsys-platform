import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { ServiceOrdersModule } from 'src/modules/service-orders/service-orders.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { FinanceService } from './application/finance/finance.service';
import { CashflowController } from './http/cashflow.controller';
import { FinancialExceptionsController } from './http/financial-exceptions.controller';
import { PaymentsController } from './http/payments.controller';
import { ServiceOrderFinanceController } from './http/service-order-finance.controller';
import { FinancialExceptionEntity } from './infrastructure/persistence/entities/financial-exception.entity';
import { PartialPaymentEntity } from './infrastructure/persistence/entities/partial-payment.entity';
import { PaymentRecordEntity } from './infrastructure/persistence/entities/payment-record.entity';
import { FinancialExceptionRepository } from './infrastructure/persistence/repositories/financial-exception.repository';
import { PartialPaymentRepository } from './infrastructure/persistence/repositories/partial-payment.repository';
import { PaymentRecordRepository } from './infrastructure/persistence/repositories/payment-record.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRecordEntity, PartialPaymentEntity, FinancialExceptionEntity]), AuditModule, TenantModule, BranchModule, ServiceOrdersModule],
  controllers: [PaymentsController, FinancialExceptionsController, CashflowController, ServiceOrderFinanceController],
  providers: [FinanceService, PaymentRecordRepository, PartialPaymentRepository, FinancialExceptionRepository],
  exports: [FinanceService],
})
export class FinanceModule {}
