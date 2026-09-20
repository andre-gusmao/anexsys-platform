import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { CrmModule } from 'src/modules/crm/crm.module';
import { OperationalResourcesModule } from 'src/modules/operational-resources/operational-resources.module';
import { ServiceOrdersModule } from 'src/modules/service-orders/service-orders.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { ProductionOrderService } from './application/production-order/production-order.service';
import { QrTrackingService } from './application/qr-tracking/qr-tracking.service';
import { ProductionOrdersController } from './http/production-orders.controller';
import { QrEventsController } from './http/qr-events.controller';
import { ServiceOrderProductionOrderController } from './http/service-order-production-order.controller';
import { ProductionExecutionEventEntity } from './infrastructure/persistence/entities/production-execution-event.entity';
import { ProductionOrderOperationalAssignmentEntity } from './infrastructure/persistence/entities/production-order-operational-assignment.entity';
import { ProductionOrderItemLinkEntity } from './infrastructure/persistence/entities/production-order-item-link.entity';
import { ProductionOrderVersionEntity } from './infrastructure/persistence/entities/production-order-version.entity';
import { ProductionOrderEntity } from './infrastructure/persistence/entities/production-order.entity';
import { QrCodeEntity } from './infrastructure/persistence/entities/qr-code.entity';
import { QrEventEntity } from './infrastructure/persistence/entities/qr-event.entity';
import { ProductionExecutionEventRepository } from './infrastructure/persistence/repositories/production-execution-event.repository';
import { ProductionOrderOperationalAssignmentRepository } from './infrastructure/persistence/repositories/production-order-operational-assignment.repository';
import { ProductionOrderItemLinkRepository } from './infrastructure/persistence/repositories/production-order-item-link.repository';
import { ProductionOrderRepository } from './infrastructure/persistence/repositories/production-order.repository';
import { ProductionOrderVersionRepository } from './infrastructure/persistence/repositories/production-order-version.repository';
import { QrCodeRepository } from './infrastructure/persistence/repositories/qr-code.repository';
import { QrEventRepository } from './infrastructure/persistence/repositories/qr-event.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionOrderEntity,
      ProductionOrderItemLinkEntity,
      ProductionOrderVersionEntity,
      ProductionOrderOperationalAssignmentEntity,
      QrCodeEntity,
      QrEventEntity,
      ProductionExecutionEventEntity,
    ]),
    AuditModule,
    TenantModule,
    BranchModule,
    ServiceOrdersModule,
    CrmModule,
    OperationalResourcesModule,
  ],
  controllers: [ProductionOrdersController, ServiceOrderProductionOrderController, QrEventsController],
  providers: [
    ProductionOrderService,
    QrTrackingService,
    ProductionOrderRepository,
    ProductionOrderItemLinkRepository,
    ProductionOrderVersionRepository,
    ProductionOrderOperationalAssignmentRepository,
    QrCodeRepository,
    QrEventRepository,
    ProductionExecutionEventRepository,
  ],
  exports: [ProductionOrderService, ProductionOrderOperationalAssignmentRepository, QrTrackingService],
})
export class ProductionOrdersModule {}
