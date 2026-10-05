import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { OperationalResourcesModule } from 'src/modules/operational-resources/operational-resources.module';
import { ProductionOrdersModule } from 'src/modules/production-orders/production-orders.module';
import { ServiceOrdersModule } from 'src/modules/service-orders/service-orders.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { ReworkService } from './application/rework/rework.service';
import { ReworkCasesController } from './http/rework-cases.controller';
import { ReworkCaseEntity } from './infrastructure/persistence/entities/rework-case.entity';
import { ReworkCaseRepository } from './infrastructure/persistence/repositories/rework-case.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReworkCaseEntity]), AuditModule, TenantModule, BranchModule, ProductionOrdersModule, OperationalResourcesModule, ServiceOrdersModule],
  controllers: [ReworkCasesController],
  providers: [ReworkService, ReworkCaseRepository],
  exports: [ReworkService],
})
export class ReworkModule {}
