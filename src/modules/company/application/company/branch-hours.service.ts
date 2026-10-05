import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { BranchOperatingHoursEntity } from '../../infrastructure/persistence/entities/branch-operating-hours.entity';
import { BranchOperatingHoursRepository } from '../../infrastructure/persistence/repositories/branch-operating-hours.repository';
import { DEFAULT_BRANCH_TIMEZONE, defaultOperatingHours, WeekdayHoursInput } from '../company.defaults';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

@Injectable()
export class BranchHoursService {
  constructor(
    private readonly hoursRepository: BranchOperatingHoursRepository,
    private readonly branchService: BranchService,
  ) {}

  async seedDefaults(tenantId: string, branchId: string, actorUserId: string): Promise<BranchOperatingHoursEntity[]> {
    return this.replaceHours(tenantId, branchId, defaultOperatingHours(), actorUserId);
  }

  async list(tenantId: string, branchId: string): Promise<{ timezone: string; days: BranchOperatingHoursEntity[] }> {
    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    let days = await this.hoursRepository.findByBranch(tenantId, branchId);
    if (days.length === 0) {
      days = await this.seedDefaults(tenantId, branchId, branch.updatedBy);
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
    this.assertWeekdays(days);
    if (timezone) {
      await this.branchService.update(branchId, { timezone, actorUserId });
    }

    await this.hoursRepository.deleteByBranch(tenantId, branchId);
    const rows = days.map((day) =>
      this.hoursRepository.create({
        id: randomUUID(),
        tenantId,
        branchId,
        weekday: day.weekday,
        isOpen: day.isOpen,
        opensAt: day.isOpen ? this.normalizeTime(day.opensAt, 'opensAt') : null,
        closesAt: day.isOpen ? this.normalizeTime(day.closesAt, 'closesAt') : null,
        cutoffAt: day.isOpen ? this.normalizeTime(day.cutoffAt ?? day.closesAt, 'cutoffAt') : null,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      }),
    );
    return this.hoursRepository.saveMany(rows);
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

  private assertWeekdays(days: WeekdayHoursInput[]): void {
    if (days.length !== 7) {
      throw new DomainValidationError('Operating hours must include all seven weekdays.');
    }
    const seen = new Set(days.map((day) => day.weekday));
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      if (!seen.has(weekday)) {
        throw new DomainValidationError('Operating hours must include all seven weekdays.');
      }
    }
  }

  private normalizeTime(value: string | null | undefined, label: string): string {
    if (!value || !TIME_PATTERN.test(value)) {
      throw new DomainValidationError(`${label} must be a valid time (HH:MM).`);
    }
    const [hours, minutes] = value.split(':');
    return `${hours}:${minutes}`;
  }
}
