import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { BranchModule } from '../branch/branch.module';
import { OperationalResourcesModule } from '../operational-resources/operational-resources.module';
import { ProductionOrdersModule } from '../production-orders/production-orders.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { TenantModule } from '../tenant/tenant.module';
import { CustodyService } from './application/custody/custody.service';
import { CustodyEventsController } from './http/custody-events.controller';
import { StorageLocationsController } from './http/storage-locations.controller';
import { CameraSnapshotEntity } from './infrastructure/persistence/entities/camera-snapshot.entity';
import { CctvReferenceEntity } from './infrastructure/persistence/entities/cctv-reference.entity';
import { CustodyEventEntity } from './infrastructure/persistence/entities/custody-event.entity';
import { PhysicalBagSupportContextEntity } from './infrastructure/persistence/entities/physical-bag-support-context.entity';
import { StorageLocationAssignmentEntity } from './infrastructure/persistence/entities/storage-location-assignment.entity';
import { StorageLocationEntity } from './infrastructure/persistence/entities/storage-location.entity';
import { CameraSnapshotRepository } from './infrastructure/persistence/repositories/camera-snapshot.repository';
import { CctvReferenceRepository } from './infrastructure/persistence/repositories/cctv-reference.repository';
import { CustodyEventRepository } from './infrastructure/persistence/repositories/custody-event.repository';
import { PhysicalBagSupportContextRepository } from './infrastructure/persistence/repositories/physical-bag-support-context.repository';
import { StorageLocationAssignmentRepository } from './infrastructure/persistence/repositories/storage-location-assignment.repository';
import { StorageLocationRepository } from './infrastructure/persistence/repositories/storage-location.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StorageLocationEntity, StorageLocationAssignmentEntity, PhysicalBagSupportContextEntity, CustodyEventEntity, CctvReferenceEntity, CameraSnapshotEntity]), AuditModule, TenantModule, BranchModule, ServiceOrdersModule, ProductionOrdersModule, OperationalResourcesModule],
  controllers: [StorageLocationsController, CustodyEventsController],
  providers: [CustodyService, StorageLocationRepository, StorageLocationAssignmentRepository, PhysicalBagSupportContextRepository, CustodyEventRepository, CctvReferenceRepository, CameraSnapshotRepository],
  exports: [CustodyService, StorageLocationRepository, StorageLocationAssignmentRepository, PhysicalBagSupportContextRepository, CustodyEventRepository],
})
export class CustodyModule {}
