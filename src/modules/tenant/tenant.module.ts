import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { CompanyModule } from 'src/modules/company/company.module';
import { GovernanceModule } from 'src/modules/governance/governance.module';
import { TenantsController } from './http/tenants.controller';
import { TenantService } from './application/tenant/tenant.service';
import { TenantEntity } from './infrastructure/persistence/entities/tenant.entity';
import { TenantRepository } from './infrastructure/persistence/repositories/tenant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity]), AuditModule, GovernanceModule, forwardRef(() => CompanyModule)],
  controllers: [TenantsController],
  providers: [TenantService, TenantRepository],
  exports: [TenantService, TenantRepository],
})
export class TenantModule {}
