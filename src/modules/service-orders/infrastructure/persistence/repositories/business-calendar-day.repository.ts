import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CalendarDayScope } from 'src/shared/domain/enums';
import { BusinessCalendarDayEntity } from '../entities/business-calendar-day.entity';

@Injectable()
export class BusinessCalendarDayRepository {
  constructor(
    @InjectRepository(BusinessCalendarDayEntity)
    private readonly repository: Repository<BusinessCalendarDayEntity>,
  ) {}

  create(payload: Partial<BusinessCalendarDayEntity>): BusinessCalendarDayEntity {
    return this.repository.create(payload);
  }

  async save(entry: BusinessCalendarDayEntity): Promise<BusinessCalendarDayEntity> {
    return this.repository.save(entry);
  }

  async findApplicable(tenantId: string, branchId: string, calendarDate: string): Promise<BusinessCalendarDayEntity[]> {
    return this.repository
      .createQueryBuilder('calendar_day')
      .where('calendar_day.tenant_id = :tenantId', { tenantId })
      .andWhere('calendar_day.calendar_date = :calendarDate', { calendarDate })
      .andWhere('calendar_day.is_deleted = false')
      .andWhere(
        new Brackets((query) => {
          query
            .where('calendar_day.scope_type = :tenantScope AND calendar_day.branch_id IS NULL', {
              tenantScope: CalendarDayScope.TENANT,
            })
            .orWhere('calendar_day.scope_type = :branchScope AND calendar_day.branch_id = :branchId', {
              branchScope: CalendarDayScope.BRANCH,
              branchId,
            })
            .orWhere(
              '(calendar_day.scope_type = :holidayScope AND (calendar_day.branch_id IS NULL OR calendar_day.branch_id = :branchId))',
              { holidayScope: CalendarDayScope.HOLIDAY, branchId },
            );
        }),
      )
      .orderBy('calendar_day.scope_type', 'ASC')
      .getMany();
  }
}
