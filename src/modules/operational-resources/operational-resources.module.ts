import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { ProductionOrderOperationalAssignmentEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/production-order-operational-assignment.entity';
import { ProductionOrderOperationalAssignmentRepository } from 'src/modules/production-orders/infrastructure/persistence/repositories/production-order-operational-assignment.repository';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { OperationalResourceService } from './application/operational-resource/operational-resource.service';
import { OperationalResourcesController } from './http/operational-resources.controller';
import { OperationalResourceBranchScopeEntity } from './infrastructure/persistence/entities/operational-resource-branch-scope.entity';
import { OperationalResourceEntity } from './infrastructure/persistence/entities/operational-resource.entity';
import { OperationalResourceBranchScopeRepository } from './infrastructure/persistence/repositories/operational-resource-branch-scope.repository';
import { OperationalResourceRepository } from './infrastructure/persistence/repositories/operational-resource.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperationalResourceEntity,
      OperationalResourceBranchScopeEntity,
      ProductionOrderOperationalAssignmentEntity,
    ]),
    AuditModule,
    TenantModule,
    BranchModule,
  ],
  controllers: [OperationalResourcesController],
  providers: [
    OperationalResourceService,
    OperationalResourceRepository,
    OperationalResourceBranchScopeRepository,
    ProductionOrderOperationalAssignmentRepository,
  ],
  exports: [OperationalResourceService],
})
export class OperationalResourcesModule {}
