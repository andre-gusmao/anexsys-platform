import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { CompanyModule } from 'src/modules/company/company.module';
import { GovernanceModule } from 'src/modules/governance/governance.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { BranchesController } from './http/branches.controller';
import { BranchService } from './application/branch/branch.service';
import { BranchEntity } from './infrastructure/persistence/entities/branch.entity';
import { BranchRepository } from './infrastructure/persistence/repositories/branch.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BranchEntity]), AuditModule, TenantModule, GovernanceModule, forwardRef(() => CompanyModule)],
  controllers: [BranchesController],
  providers: [BranchService, BranchRepository],
  exports: [BranchService, BranchRepository],
})
export class BranchModule {}
