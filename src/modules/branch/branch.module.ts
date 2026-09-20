import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { BranchService } from './application/branch/branch.service';
import { BranchEntity } from './infrastructure/persistence/entities/branch.entity';
import { BranchRepository } from './infrastructure/persistence/repositories/branch.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BranchEntity]), AuditModule, TenantModule],
  providers: [BranchService, BranchRepository],
  exports: [BranchService, BranchRepository],
})
export class BranchModule {}
