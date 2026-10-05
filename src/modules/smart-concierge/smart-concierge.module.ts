import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { BranchModule } from '../branch/branch.module';
import { CrmModule } from '../crm/crm.module';
import { CustomerPortalModule } from '../customer-portal/customer-portal.module';
import { CustodyModule } from '../custody/custody.module';
import { FinanceModule } from '../finance/finance.module';
import { PickupModule } from '../pickup/pickup.module';
import { CommunicationEventEntity } from '../pickup/infrastructure/persistence/entities/communication-event.entity';
import { CommunicationEventRepository } from '../pickup/infrastructure/persistence/repositories/communication-event.repository';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { TenantModule } from '../tenant/tenant.module';
import { WarrantyModule } from '../warranty/warranty.module';
import { SmartConciergeService } from './application/smart-concierge/smart-concierge.service';
import { SmartConciergeController } from './http/smart-concierge.controller';
import { SmartConciergeCheckInEntity } from './infrastructure/persistence/entities/smart-concierge-check-in.entity';
import { SmartConciergeCheckInRepository } from './infrastructure/persistence/repositories/smart-concierge-check-in.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmartConciergeCheckInEntity, CommunicationEventEntity]),
    AuditModule,
    TenantModule,
    BranchModule,
    CrmModule,
    CustomerPortalModule,
    ServiceOrdersModule,
    PickupModule,
    CustodyModule,
    WarrantyModule,
    FinanceModule,
  ],
  controllers: [SmartConciergeController],
  providers: [SmartConciergeService, SmartConciergeCheckInRepository, CommunicationEventRepository],
})
export class SmartConciergeModule {}
