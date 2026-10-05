import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { OperationalResourcesModule } from 'src/modules/operational-resources/operational-resources.module';
import { ProductionOrdersModule } from 'src/modules/production-orders/production-orders.module';
import { ServiceOrdersModule } from 'src/modules/service-orders/service-orders.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { WarrantyService } from './application/warranty/warranty.service';
import { WarrantyAdjustmentsController } from './http/warranty-adjustments.controller';
import { WarrantyExecutionsController } from './http/warranty-executions.controller';
import { WarrantyAdjustmentEntity } from './infrastructure/persistence/entities/warranty-adjustment.entity';
import { WarrantyExecutionEntity } from './infrastructure/persistence/entities/warranty-execution.entity';
import { WarrantyAdjustmentRepository } from './infrastructure/persistence/repositories/warranty-adjustment.repository';
import { WarrantyExecutionRepository } from './infrastructure/persistence/repositories/warranty-execution.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WarrantyAdjustmentEntity, WarrantyExecutionEntity]), AuditModule, TenantModule, BranchModule, ProductionOrdersModule, OperationalResourcesModule, ServiceOrdersModule],
  controllers: [WarrantyAdjustmentsController, WarrantyExecutionsController],
  providers: [WarrantyService, WarrantyAdjustmentRepository, WarrantyExecutionRepository],
  exports: [WarrantyService],
})
export class WarrantyModule {}
