import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './application/audit/audit.service';
import { AuditEventEntity } from './infrastructure/persistence/entities/audit-event.entity';
import { AuditEventRepository } from './infrastructure/persistence/repositories/audit-event.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEventEntity])],
  providers: [AuditService, AuditEventRepository],
  exports: [AuditService, AuditEventRepository],
})
export class AuditModule {}
