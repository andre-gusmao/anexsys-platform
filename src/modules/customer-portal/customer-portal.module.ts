import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { CrmModule } from '../crm/crm.module';
import { CustodyModule } from '../custody/custody.module';
import { FinanceModule } from '../finance/finance.module';
import { PickupModule } from '../pickup/pickup.module';
import { DigitalApprovalEntity } from '../pickup/infrastructure/persistence/entities/digital-approval.entity';
import { CommunicationEventEntity } from '../pickup/infrastructure/persistence/entities/communication-event.entity';
import { CommunicationEventRepository } from '../pickup/infrastructure/persistence/repositories/communication-event.repository';
import { DigitalApprovalRepository } from '../pickup/infrastructure/persistence/repositories/digital-approval.repository';
import { PickupAuthorizationRepository } from '../pickup/infrastructure/persistence/repositories/pickup-authorization.repository';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { WarrantyModule } from '../warranty/warranty.module';
import { CustomerPortalService } from './application/customer-portal/customer-portal.service';
import { CustomerPortalController } from './http/customer-portal.controller';
import { CustomerPortalProfileEntity } from './infrastructure/persistence/entities/customer-portal-profile.entity';
import { StatusVisibilityMappingEntity } from './infrastructure/persistence/entities/status-visibility-mapping.entity';
import { CustomerPortalProfileRepository } from './infrastructure/persistence/repositories/customer-portal-profile.repository';
import { StatusVisibilityMappingRepository } from './infrastructure/persistence/repositories/status-visibility-mapping.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerPortalProfileEntity,
      StatusVisibilityMappingEntity,
      DigitalApprovalEntity,
      CommunicationEventEntity,
    ]),
    AuditModule,
    CrmModule,
    ServiceOrdersModule,
    PickupModule,
    CustodyModule,
    WarrantyModule,
    FinanceModule,
  ],
  controllers: [CustomerPortalController],
  providers: [
    CustomerPortalService,
    CustomerPortalProfileRepository,
    StatusVisibilityMappingRepository,
    DigitalApprovalRepository,
    CommunicationEventRepository,
    PickupAuthorizationRepository,
  ],
  exports: [CustomerPortalService, CustomerPortalProfileRepository],
})
export class CustomerPortalModule {}
