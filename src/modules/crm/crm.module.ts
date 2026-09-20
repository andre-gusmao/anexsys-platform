import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { TenantModule } from 'src/modules/tenant/tenant.module';
import { CustomerService } from './application/customer/customer.service';
import { MeasurementService } from './application/measurement/measurement.service';
import { CustomersController } from './http/customers.controller';
import { CustomerEntity } from './infrastructure/persistence/entities/customer.entity';
import { CustomerContactEntity } from './infrastructure/persistence/entities/customer-contact.entity';
import { CustomerInteractionEntity } from './infrastructure/persistence/entities/customer-interaction.entity';
import { MeasurementRecordEntity } from './infrastructure/persistence/entities/measurement-record.entity';
import { CustomerContactRepository } from './infrastructure/persistence/repositories/customer-contact.repository';
import { CustomerInteractionRepository } from './infrastructure/persistence/repositories/customer-interaction.repository';
import { CustomerRepository } from './infrastructure/persistence/repositories/customer.repository';
import { MeasurementRecordRepository } from './infrastructure/persistence/repositories/measurement-record.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerEntity,
      CustomerContactEntity,
      CustomerInteractionEntity,
      MeasurementRecordEntity,
    ]),
    AuditModule,
    BranchModule,
    TenantModule,
  ],
  controllers: [CustomersController],
  providers: [
    CustomerService,
    MeasurementService,
    CustomerRepository,
    CustomerContactRepository,
    CustomerInteractionRepository,
    MeasurementRecordRepository,
  ],
  exports: [CustomerService, MeasurementService],
})
export class CrmModule {}
