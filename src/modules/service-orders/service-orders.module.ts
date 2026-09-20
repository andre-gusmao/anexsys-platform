import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { CrmModule } from 'src/modules/crm/crm.module';
import { IdentityModule } from 'src/modules/identity/identity.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { DeliveryDateService } from './application/delivery-date/delivery-date.service';
import { ServiceOrderService } from './application/service-order/service-order.service';
import { ServiceOrdersController } from './http/service-orders.controller';
import { BusinessCalendarDayEntity } from './infrastructure/persistence/entities/business-calendar-day.entity';
import { ServiceOrderEntity } from './infrastructure/persistence/entities/service-order.entity';
import { ServiceOrderItemEntity } from './infrastructure/persistence/entities/service-order-item.entity';
import { BusinessCalendarDayRepository } from './infrastructure/persistence/repositories/business-calendar-day.repository';
import { ServiceOrderItemRepository } from './infrastructure/persistence/repositories/service-order-item.repository';
import { ServiceOrderRepository } from './infrastructure/persistence/repositories/service-order.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessCalendarDayEntity, ServiceOrderEntity, ServiceOrderItemEntity]),
    AuditModule,
    TenantModule,
    BranchModule,
    CrmModule,
    IdentityModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [
    DeliveryDateService,
    ServiceOrderService,
    BusinessCalendarDayRepository,
    ServiceOrderRepository,
    ServiceOrderItemRepository,
  ],
  exports: [DeliveryDateService, ServiceOrderService, ServiceOrderRepository, BusinessCalendarDayRepository],
})
export class ServiceOrdersModule {}
