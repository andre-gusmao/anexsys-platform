import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { CrmModule } from 'src/modules/crm/crm.module';
import { OperationalResourcesModule } from 'src/modules/operational-resources/operational-resources.module';
import { ServiceOrdersModule } from 'src/modules/service-orders/service-orders.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { ProductionOrderService } from './application/production-order/production-order.service';
import { ProductionOrdersController } from './http/production-orders.controller';
import { ServiceOrderProductionOrderController } from './http/service-order-production-order.controller';
import { ProductionOrderOperationalAssignmentEntity } from './infrastructure/persistence/entities/production-order-operational-assignment.entity';
import { ProductionOrderItemLinkEntity } from './infrastructure/persistence/entities/production-order-item-link.entity';
import { ProductionOrderVersionEntity } from './infrastructure/persistence/entities/production-order-version.entity';
import { ProductionOrderEntity } from './infrastructure/persistence/entities/production-order.entity';
import { ProductionOrderOperationalAssignmentRepository } from './infrastructure/persistence/repositories/production-order-operational-assignment.repository';
import { ProductionOrderItemLinkRepository } from './infrastructure/persistence/repositories/production-order-item-link.repository';
import { ProductionOrderRepository } from './infrastructure/persistence/repositories/production-order.repository';
import { ProductionOrderVersionRepository } from './infrastructure/persistence/repositories/production-order-version.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionOrderEntity,
      ProductionOrderItemLinkEntity,
      ProductionOrderVersionEntity,
      ProductionOrderOperationalAssignmentEntity,
    ]),
    AuditModule,
    TenantModule,
    BranchModule,
    ServiceOrdersModule,
    CrmModule,
    OperationalResourcesModule,
  ],
  controllers: [ProductionOrdersController, ServiceOrderProductionOrderController],
  providers: [
    ProductionOrderService,
    ProductionOrderRepository,
    ProductionOrderItemLinkRepository,
    ProductionOrderVersionRepository,
    ProductionOrderOperationalAssignmentRepository,
  ],
  exports: [ProductionOrderService, ProductionOrderOperationalAssignmentRepository],
})
export class ProductionOrdersModule {}
