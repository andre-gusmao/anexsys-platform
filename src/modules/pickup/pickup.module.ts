import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { BranchModule } from '../branch/branch.module';
import { CustodyModule } from '../custody/custody.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { TenantModule } from '../tenant/tenant.module';
import { PickupService } from './application/pickup/pickup.service';
import { PickupAuthorizationsController } from './http/pickup-authorizations.controller';
import { CommunicationEventEntity } from './infrastructure/persistence/entities/communication-event.entity';
import { DigitalApprovalEntity } from './infrastructure/persistence/entities/digital-approval.entity';
import { PickupAuthorizationEntity } from './infrastructure/persistence/entities/pickup-authorization.entity';
import { PickupQrCodeEntity } from './infrastructure/persistence/entities/pickup-qr-code.entity';
import { PickupTokenEntity } from './infrastructure/persistence/entities/pickup-token.entity';
import { TemporaryPickupCodeEntity } from './infrastructure/persistence/entities/temporary-pickup-code.entity';
import { CommunicationEventRepository } from './infrastructure/persistence/repositories/communication-event.repository';
import { DigitalApprovalRepository } from './infrastructure/persistence/repositories/digital-approval.repository';
import { PickupAuthorizationRepository } from './infrastructure/persistence/repositories/pickup-authorization.repository';
import { PickupQrCodeRepository } from './infrastructure/persistence/repositories/pickup-qr-code.repository';
import { PickupTokenRepository } from './infrastructure/persistence/repositories/pickup-token.repository';
import { TemporaryPickupCodeRepository } from './infrastructure/persistence/repositories/temporary-pickup-code.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PickupAuthorizationEntity, PickupTokenEntity, PickupQrCodeEntity, TemporaryPickupCodeEntity, CommunicationEventEntity, DigitalApprovalEntity]), AuditModule, TenantModule, BranchModule, ServiceOrdersModule, CustodyModule],
  controllers: [PickupAuthorizationsController],
  providers: [PickupService, PickupAuthorizationRepository, PickupTokenRepository, PickupQrCodeRepository, TemporaryPickupCodeRepository, CommunicationEventRepository, DigitalApprovalRepository],
  exports: [PickupService, PickupAuthorizationRepository],
})
export class PickupModule {}
