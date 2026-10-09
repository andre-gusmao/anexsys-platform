import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { CompanyModule } from 'src/modules/company/company.module';
import { CrmModule } from 'src/modules/crm/crm.module';
import { IdentityModule } from 'src/modules/identity/identity.module';
import { GovernanceModule } from 'src/modules/governance/governance.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { AtelierCatalogService } from './application/atelier-catalog/atelier-catalog.service';
import { DeliveryDateService } from './application/delivery-date/delivery-date.service';
import { ServiceOrderService } from './application/service-order/service-order.service';
import { AtelierServicesController, GarmentProductsController } from './http/atelier-catalog.controller';
import { ServiceOrdersController } from './http/service-orders.controller';
import { AtelierServiceEntity } from './infrastructure/persistence/entities/atelier-service.entity';
import { BusinessCalendarDayEntity } from './infrastructure/persistence/entities/business-calendar-day.entity';
import { GarmentProductEntity } from './infrastructure/persistence/entities/garment-product.entity';
import { ServiceOrderEntity } from './infrastructure/persistence/entities/service-order.entity';
import { ServiceOrderItemEntity } from './infrastructure/persistence/entities/service-order-item.entity';
import { ServiceOrderPickupEntity } from './infrastructure/persistence/entities/service-order-pickup.entity';
import { ServiceOrderProofNoteEntity } from './infrastructure/persistence/entities/service-order-proof-note.entity';
import { AtelierServiceRepository } from './infrastructure/persistence/repositories/atelier-service.repository';
import { BusinessCalendarDayRepository } from './infrastructure/persistence/repositories/business-calendar-day.repository';
import { GarmentProductRepository } from './infrastructure/persistence/repositories/garment-product.repository';
import { ServiceOrderItemRepository } from './infrastructure/persistence/repositories/service-order-item.repository';
import { ServiceOrderPickupRepository } from './infrastructure/persistence/repositories/service-order-pickup.repository';
import { ServiceOrderProofNoteRepository } from './infrastructure/persistence/repositories/service-order-proof-note.repository';
import { ServiceOrderRepository } from './infrastructure/persistence/repositories/service-order.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AtelierServiceEntity,
      BusinessCalendarDayEntity,
      GarmentProductEntity,
      ServiceOrderEntity,
      ServiceOrderItemEntity,
      ServiceOrderProofNoteEntity,
      ServiceOrderPickupEntity,
    ]),
    AuditModule,
    TenantModule,
    BranchModule,
    CrmModule,
    IdentityModule,
    CompanyModule,
    GovernanceModule,
  ],
  controllers: [ServiceOrdersController, GarmentProductsController, AtelierServicesController],
  providers: [
    AtelierCatalogService,
    DeliveryDateService,
    ServiceOrderService,
    AtelierServiceRepository,
    BusinessCalendarDayRepository,
    GarmentProductRepository,
    ServiceOrderRepository,
    ServiceOrderItemRepository,
    ServiceOrderProofNoteRepository,
    ServiceOrderPickupRepository,
  ],
  exports: [AtelierCatalogService, DeliveryDateService, ServiceOrderService, ServiceOrderRepository, BusinessCalendarDayRepository],
})
export class ServiceOrdersModule {}
