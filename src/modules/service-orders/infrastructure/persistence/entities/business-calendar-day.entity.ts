import { Column, Entity } from 'typeorm';
import { CalendarDayScope } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'business_calendar_days' })
export class BusinessCalendarDayEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId!: string | null;

  @Column({ name: 'scope_type', type: 'varchar', length: 20 })
  scopeType!: CalendarDayScope;

  @Column({ name: 'calendar_date', type: 'date' })
  calendarDate!: string;

  @Column({ name: 'is_working_day', type: 'boolean' })
  isWorkingDay!: boolean;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;
}
