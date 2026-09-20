import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { TenantService } from './application/tenant/tenant.service';
import { TenantEntity } from './infrastructure/persistence/entities/tenant.entity';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity]), AuditModule],
  providers: [TenantService, TenantRepository],
  exports: [TenantService, TenantRepository],
})
export class TenantModule {}
