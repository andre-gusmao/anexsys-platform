import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { ProductionOrdersModule } from 'src/modules/production-orders/production-orders.module';
import { ReworkModule } from 'src/modules/rework/rework.module';
import { ServiceOrdersModule } from 'src/modules/service-orders/service-orders.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { WarrantyModule } from 'src/modules/warranty/warranty.module';
import { QualityService } from './application/quality/quality.service';
import { CustomerRejectionsController } from './http/customer-rejections.controller';
import { ProductionOrderQualityController, QualityRecordsController } from './http/quality-records.controller';
import { CustomerRejectionEntity } from './infrastructure/persistence/entities/customer-rejection.entity';
import { QualityRecordEntity } from './infrastructure/persistence/entities/quality-record.entity';
import { CustomerRejectionRepository } from './infrastructure/persistence/repositories/customer-rejection.repository';
import { QualityRecordRepository } from './infrastructure/persistence/repositories/quality-record.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityRecordEntity, CustomerRejectionEntity]),
    AuditModule,
    TenantModule,
    BranchModule,
    ProductionOrdersModule,
    ServiceOrdersModule,
    ReworkModule,
    WarrantyModule,
  ],
  controllers: [QualityRecordsController, ProductionOrderQualityController, CustomerRejectionsController],
  providers: [QualityService, QualityRecordRepository, CustomerRejectionRepository],
  exports: [QualityService],
})
export class QualityModule {}
