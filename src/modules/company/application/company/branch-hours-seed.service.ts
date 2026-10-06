import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { BranchOperatingHoursEntity } from '../../infrastructure/persistence/entities/branch-operating-hours.entity';
import { BranchOperatingHoursRepository } from '../../infrastructure/persistence/repositories/branch-operating-hours.repository';
import { defaultOperatingHours, WeekdayHoursInput } from '../company.defaults';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

@Injectable()
export class BranchHoursSeedService {
  constructor(
    @Inject(BranchOperatingHoursRepository)
    private readonly hoursRepository: BranchOperatingHoursRepository,
  ) {}

  async seedDefaults(tenantId: string, branchId: string, actorUserId: string): Promise<BranchOperatingHoursEntity[]> {
    return this.writeHours(tenantId, branchId, defaultOperatingHours(), actorUserId);
  }

  async listByBranch(tenantId: string, branchId: string): Promise<BranchOperatingHoursEntity[]> {
    return this.hoursRepository.findByBranch(tenantId, branchId);
  }

  async writeHours(
    tenantId: string,
    branchId: string,
    days: WeekdayHoursInput[],
    actorUserId: string,
  ): Promise<BranchOperatingHoursEntity[]> {
    this.assertWeekdays(days);
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
