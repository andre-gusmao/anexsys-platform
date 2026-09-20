import { Injectable } from '@nestjs/common';
import { addDays } from './utils';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { BusinessCalendarDayRepository } from '../../infrastructure/persistence/repositories/business-calendar-day.repository';

@Injectable()
export class DeliveryDateService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly businessCalendarDayRepository: BusinessCalendarDayRepository,
  ) {}

  async suggestDeliveryDate(tenantId: string, branchId: string, sourceAt: Date): Promise<string> {
    await this.tenantService.getById(tenantId);
    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }

    let candidate = addDays(this.toDateOnly(sourceAt), 7);
    for (let guard = 0; guard < 366; guard += 1) {
      const rules = await this.businessCalendarDayRepository.findApplicable(tenantId, branchId, candidate);
      if (!rules.some((rule) => rule.isWorkingDay === false)) {
        return candidate;
      }
      candidate = addDays(candidate, 1);
    }

    throw new DomainValidationError('Unable to calculate a valid promised delivery date.');
  }

  private toDateOnly(value: Date): string {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
