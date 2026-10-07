import { Inject, Injectable } from '@nestjs/common';
import { requireClockTime } from './clock-time';
import { addDays } from './utils';
import { BranchHoursService } from 'src/modules/company/application/company/branch-hours.service';
import { DEFAULT_BRANCH_TIMEZONE } from 'src/modules/company/application/company.defaults';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { DeliveryType } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { BusinessCalendarDayRepository } from '../../infrastructure/persistence/repositories/business-calendar-day.repository';

export type DeliverySuggestion = {
  promisedDeliveryDate: string;
  promisedDeliveryTime: string;
};

type HoursDay = {
  weekday: number;
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  cutoffAt: string | null;
};

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
    const suggestion = await this.suggestDelivery(tenantId, branchId, sourceAt);
    return suggestion.promisedDeliveryDate;
  }

  async suggestDelivery(
    tenantId: string,
    branchId: string,
    sourceAt: Date,
    options?: { deliveryType?: DeliveryType; itemCount?: number },
  ): Promise<DeliverySuggestion> {
    await this.tenantService.getById(tenantId);
    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }

    const timezone = branch.timezone || DEFAULT_BRANCH_TIMEZONE;
    const hours = await this.branchHoursService.list(tenantId, branchId);
    const deliveryType = options?.deliveryType ?? DeliveryType.STANDARD;
    const itemCount = Math.max(1, options?.itemCount ?? 1);
    const effectiveDate = this.resolveEffectiveOpenDate(sourceAt, timezone, hours.days);

    if (deliveryType === DeliveryType.EXPRESS) {
      return this.suggestExpress(tenantId, branchId, sourceAt, timezone, hours.days, effectiveDate, itemCount);
    }

    if (deliveryType === DeliveryType.PRIORITY) {
      const promisedDeliveryDate = await this.addWorkingDays(tenantId, branchId, hours.days, effectiveDate, 3);
      return { promisedDeliveryDate, promisedDeliveryTime: this.closingTime(hours.days, promisedDeliveryDate) };
    }

    const promisedDeliveryDate = await this.nextValidCalendarDate(tenantId, branchId, hours.days, addDays(effectiveDate, 7));
    return { promisedDeliveryDate, promisedDeliveryTime: this.closingTime(hours.days, promisedDeliveryDate) };
  }

  private async suggestExpress(
    tenantId: string,
    branchId: string,
    sourceAt: Date,
    timezone: string,
    days: HoursDay[],
    effectiveDate: string,
    itemCount: number,
  ): Promise<DeliverySuggestion> {
    const local = this.toZonedParts(sourceAt, timezone);
    const sourceDate = `${local.year}-${local.month}-${local.day}`;
    const opensAt = this.openingTime(days, effectiveDate);
    let currentDate = effectiveDate;
    let currentMinutes =
      sourceDate === effectiveDate && this.toMinutes(local.time) >= this.toMinutes(opensAt)
        ? this.toMinutes(local.time)
        : this.toMinutes(opensAt);
    let remaining = 120 * itemCount;

    for (let guard = 0; guard < 366 && remaining > 0; guard += 1) {
      const closeMinutes = this.toMinutes(this.closingTime(days, currentDate));
      if (currentMinutes < this.toMinutes(this.openingTime(days, currentDate))) {
        currentMinutes = this.toMinutes(this.openingTime(days, currentDate));
      }
      const available = Math.max(0, closeMinutes - currentMinutes);
      if (remaining <= available) {
        currentMinutes += remaining;
        remaining = 0;
        break;
      }
      remaining -= available;
      currentDate = await this.addWorkingDays(tenantId, branchId, days, currentDate, 1);
      currentMinutes = this.toMinutes(this.openingTime(days, currentDate));
    }

    if (remaining > 0) {
      throw new DomainValidationError('Unable to calculate a valid promised delivery date.');
    }

    return { promisedDeliveryDate: currentDate, promisedDeliveryTime: this.fromMinutes(currentMinutes) };
  }

  private async nextValidCalendarDate(tenantId: string, branchId: string, days: HoursDay[], start: string): Promise<string> {
    let candidate = start;
    for (let guard = 0; guard < 366; guard += 1) {
      if (await this.isWorkingCalendarDay(tenantId, branchId, days, candidate)) {
        return candidate;
      }
      candidate = addDays(candidate, 1);
    }
    throw new DomainValidationError('Unable to calculate a valid promised delivery date.');
  }

  private async addWorkingDays(
    tenantId: string,
    branchId: string,
    days: HoursDay[],
    start: string,
    count: number,
  ): Promise<string> {
    let candidate = start;
    let remaining = count;
    for (let guard = 0; guard < 366 && remaining > 0; guard += 1) {
      candidate = addDays(candidate, 1);
      if (await this.isWorkingCalendarDay(tenantId, branchId, days, candidate)) {
        remaining -= 1;
      }
    }
    if (remaining > 0) {
      throw new DomainValidationError('Unable to calculate a valid promised delivery date.');
    }
    return candidate;
  }

  private async isWorkingCalendarDay(tenantId: string, branchId: string, days: HoursDay[], candidate: string): Promise<boolean> {
    const rules = await this.businessCalendarDayRepository.findApplicable(tenantId, branchId, candidate);
    const hasExplicitNonWorkingRule = rules.some((rule) => rule.isWorkingDay === false);
    const hasExplicitWorkingRule = rules.some((rule) => rule.isWorkingDay === true);
    return !hasExplicitNonWorkingRule && (hasExplicitWorkingRule || this.isOpenDay(candidate, days));
  }

  private resolveEffectiveOpenDate(sourceAt: Date, timezone: string, days: HoursDay[]): string {
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

  private isOpenDay(value: string, days: HoursDay[]): boolean {
    const weekday = new Date(`${value}T12:00:00.000Z`).getUTCDay();
    return this.branchHoursService.isOpenOnWeekday(days, weekday);
  }

  private dayHours(days: HoursDay[], dateOnly: string): HoursDay | undefined {
    const weekday = new Date(`${dateOnly}T12:00:00.000Z`).getUTCDay();
    return days.find((day) => day.weekday === weekday);
  }

  private openingTime(days: HoursDay[], dateOnly: string): string {
    return requireClockTime(this.dayHours(days, dateOnly)?.opensAt, '09:30');
  }

  private closingTime(days: HoursDay[], dateOnly: string): string {
    return requireClockTime(this.dayHours(days, dateOnly)?.closesAt, '18:00');
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
  }

  private fromMinutes(value: number): string {
    const hours = String(Math.floor(value / 60)).padStart(2, '0');
    const minutes = String(value % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
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
