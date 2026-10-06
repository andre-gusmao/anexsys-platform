import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { BranchOperatingHoursEntity } from '../../infrastructure/persistence/entities/branch-operating-hours.entity';
import { DEFAULT_BRANCH_TIMEZONE, WeekdayHoursInput } from '../company.defaults';
import { BranchHoursSeedService } from './branch-hours-seed.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';

@Injectable()
export class BranchHoursService {
  constructor(
    @Inject(BranchHoursSeedService)
    private readonly hoursSeed: BranchHoursSeedService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
  ) {}

  async seedDefaults(tenantId: string, branchId: string, actorUserId: string): Promise<BranchOperatingHoursEntity[]> {
    return this.hoursSeed.seedDefaults(tenantId, branchId, actorUserId);
  }

  async list(tenantId: string, branchId: string): Promise<{ timezone: string; days: BranchOperatingHoursEntity[] }> {
    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    let days = await this.hoursSeed.listByBranch(tenantId, branchId);
    if (days.length === 0) {
      days = await this.hoursSeed.seedDefaults(tenantId, branchId, branch.updatedBy);
    }
    return { timezone: branch.timezone || DEFAULT_BRANCH_TIMEZONE, days };
  }

  async replaceHours(
    tenantId: string,
    branchId: string,
    days: WeekdayHoursInput[],
    actorUserId: string,
    timezone?: string,
  ): Promise<BranchOperatingHoursEntity[]> {
    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (timezone) {
      await this.branchService.update(branchId, { timezone, actorUserId });
    }
    return this.hoursSeed.writeHours(tenantId, branchId, days, actorUserId);
  }

  isOpenOnWeekday(days: Array<Pick<BranchOperatingHoursEntity, 'weekday' | 'isOpen'>>, weekday: number): boolean {
    const match = days.find((day) => day.weekday === weekday);
    return match ? match.isOpen : weekday !== 0;
  }

  resolveCutoff(days: Array<Pick<BranchOperatingHoursEntity, 'weekday' | 'isOpen' | 'cutoffAt' | 'closesAt'>>, weekday: number): string | null {
    const match = days.find((day) => day.weekday === weekday);
    if (!match || !match.isOpen) {
      return null;
    }
    return match.cutoffAt ?? match.closesAt;
  }
}
