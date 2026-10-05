import { Module } from '@nestjs/common';
import { DependencyValidationService } from './application/dependency-validation.service';

@Module({
  providers: [DependencyValidationService],
  exports: [DependencyValidationService],
})
export class GovernanceModule {}
