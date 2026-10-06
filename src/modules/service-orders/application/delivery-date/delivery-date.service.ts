import { Inject, Injectable } from '@nestjs/common';
import { addDays } from './utils';
import { BranchHoursService } from 'src/modules/company/application/company/branch-hours.service';
import { DEFAULT_BRANCH_TIMEZONE } from 'src/modules/company/application/company.defaults';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { BusinessCalendarDayRepository } from '../../infrastructure/persistence/repositories/business-calendar-day.repository';

@Injectable()
export class DeliveryDateService {
  constructor(
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(BusinessCalendarDayRepository)
    private readonly businessCalendarDayRepository: BusinessCalendarDayRepository,
    @Inject(BranchHoursService)
    private readonly branchHoursService: BranchHoursService,
  ) {}

  async suggestDeliveryDate(tenantId: string, branchId: string, sourceAt: Date): Promise<string> {
    await this.tenantService.getById(tenantId);
    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }

    const timezone = branch.timezone || DEFAULT_BRANCH_TIMEZONE;
    const hours = await this.branchHoursService.list(tenantId, branchId);
    let candidate = addDays(this.resolveEffectiveOpenDate(sourceAt, timezone, hours.days), 7);
    for (let guard = 0; guard < 366; guard += 1) {
      const rules = await this.businessCalendarDayRepository.findApplicable(tenantId, branchId, candidate);
      const hasExplicitNonWorkingRule = rules.some((rule) => rule.isWorkingDay === false);
      const hasExplicitWorkingRule = rules.some((rule) => rule.isWorkingDay === true);
      const isDefaultBusinessDay = this.isOpenDay(candidate, hours.days);
      if (!hasExplicitNonWorkingRule && (hasExplicitWorkingRule || isDefaultBusinessDay)) {
        return candidate;
      }
      candidate = addDays(candidate, 1);
    }

    throw new DomainValidationError('Unable to calculate a valid promised delivery date.');
  }

  private resolveEffectiveOpenDate(
    sourceAt: Date,
    timezone: string,
    days: Array<{ weekday: number; isOpen: boolean; cutoffAt: string | null; closesAt: string | null }>,
  ): string {
    const local = this.toZonedParts(sourceAt, timezone);
    let dateOnly = `${local.year}-${local.month}-${local.day}`;
    const cutoff = this.branchHoursService.resolveCutoff(days, local.weekday);
    const afterCutoff = cutoff ? local.time > cutoff : false;
    if (!this.isOpenDay(dateOnly, days) || afterCutoff) {
      for (let guard = 0; guard < 14; guard += 1) {
        dateOnly = addDays(dateOnly, 1);
        if (this.isOpenDay(dateOnly, days)) {
          break;
        }
      }
    }
    return dateOnly;
  }

  private isOpenDay(
    value: string,
    days: Array<{ weekday: number; isOpen: boolean }>,
  ): boolean {
    const weekday = new Date(`${value}T12:00:00.000Z`).getUTCDay();
    return this.branchHoursService.isOpenOnWeekday(days, weekday);
  }

  private toZonedParts(value: Date, timeZone: string): { year: string; month: string; day: string; time: string; weekday: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });
    const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]));
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      time: `${parts.hour}:${parts.minute}`,
      weekday: weekdayMap[parts.weekday] ?? 0,
    };
  }
}
