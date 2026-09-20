import { ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  CustomerInteractionType,
  CustomerStatus,
  CustomerType,
  InteractionChannel,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CustomerEntity } from '../../infrastructure/persistence/entities/customer.entity';
import { CustomerContactEntity } from '../../infrastructure/persistence/entities/customer-contact.entity';
import { CustomerInteractionEntity } from '../../infrastructure/persistence/entities/customer-interaction.entity';
import { CustomerContactRepository } from '../../infrastructure/persistence/repositories/customer-contact.repository';
import { CustomerInteractionRepository } from '../../infrastructure/persistence/repositories/customer-interaction.repository';
import { CustomerRepository, CustomerSearchFilters } from '../../infrastructure/persistence/repositories/customer.repository';
import { CreateCustomerDto } from '../../contracts/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../contracts/dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customerRepository: CustomerRepository,
    private readonly customerContactRepository: CustomerContactRepository,
    private readonly customerInteractionRepository: CustomerInteractionRepository,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerEntity> {
    await this.tenantService.getById(dto.tenantId);
    await this.assertBranch(dto.tenantId, dto.branchId ?? null);

    const normalizedPhone = this.normalizePhone(dto.mobilePhone);
    const normalizedEmail = this.normalizeEmail(dto.email);
    const normalizedCpf = this.normalizeCpfOrCnpj(dto.cpf, dto.customerType ?? CustomerType.PERSON);
    const normalizedPostalCode = this.normalizePostalCode(dto.postalCode);
    const normalizedBirthDate = this.normalizeBirthDate(dto.birthDate);

    const customer = this.customerRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: dto.branchId ?? null,
      customerType: dto.customerType ?? CustomerType.PERSON,
      legalName: dto.fullName.trim(),
      tradeName: dto.tradeName?.trim() || null,
      cpfCnpj: normalizedCpf,
      email: normalizedEmail,
      phone: normalizedPhone,
      birthDate: normalizedBirthDate,
      observations: dto.observations?.trim() || null,
      addressLine1: null,
      addressLine2: null,
      district: null,
      city: null,
      state: null,
      postalCode: normalizedPostalCode,
      status: CustomerStatus.ACTIVE,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const savedCustomer = await this.dataSource.transaction(async (manager) => {
      const persistedCustomer = manager.create(CustomerEntity, customer);
      await manager.save(CustomerEntity, persistedCustomer);

      const contact = manager.create(CustomerContactEntity, this.buildPrimaryContact(persistedCustomer, dto.actorUserId));
      await manager.save(CustomerContactEntity, contact);

      const interaction = manager.create(
        CustomerInteractionEntity,
        this.buildInteraction({
          tenantId: persistedCustomer.tenantId,
          customerId: persistedCustomer.id,
          actorUserId: dto.actorUserId,
          type: CustomerInteractionType.PROFILE_CREATED,
          summary: 'Customer profile created.',
          detail: `Customer '${persistedCustomer.legalName}' was created.`,
        }),
      );
      await manager.save(CustomerInteractionEntity, interaction);

      return persistedCustomer;
    });

    await this.auditService.record({
      tenantId: savedCustomer.tenantId,
      branchId: savedCustomer.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'customer',
      entityId: savedCustomer.id,
      action: 'customer.created',
      eventType: 'crm.write',
      metadata: { customerType: savedCustomer.customerType, phone: savedCustomer.phone },
    });

    return savedCustomer;
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.getById(id, tenantId);
    await this.assertBranch(tenantId, dto.branchId === undefined ? customer.branchId : dto.branchId);

    const previousStatus = customer.status;
    if (dto.status === CustomerStatus.BLOCKED) {
      throw new DomainValidationError('Blocked status management is outside Sprint 2 scope.');
    }

    if (dto.customerType) {
      customer.customerType = dto.customerType;
    }

    if (dto.fullName !== undefined) {
      customer.legalName = dto.fullName.trim();
    }

    if (dto.tradeName !== undefined) {
      customer.tradeName = dto.tradeName?.trim() || null;
    }

    if (dto.mobilePhone !== undefined) {
      customer.phone = this.normalizePhone(dto.mobilePhone);
    }

    if (dto.cpf !== undefined) {
      customer.cpfCnpj = this.normalizeCpfOrCnpj(dto.cpf, customer.customerType);
    }

    if (dto.email !== undefined) {
      customer.email = this.normalizeEmail(dto.email);
    }

    if (dto.postalCode !== undefined) {
      customer.postalCode = this.normalizePostalCode(dto.postalCode);
    }

    if (dto.birthDate !== undefined) {
      customer.birthDate = this.normalizeBirthDate(dto.birthDate);
    }

    if (dto.observations !== undefined) {
      customer.observations = dto.observations?.trim() || null;
    }

    if (dto.branchId !== undefined) {
      customer.branchId = dto.branchId;
    }

    if (dto.status !== undefined) {
      customer.status = dto.status;
    }

    customer.updatedBy = dto.actorUserId;

    const savedCustomer = await this.dataSource.transaction(async (manager) => {
      const persistedCustomer = await manager.save(CustomerEntity, customer);
      const existingPrimaryContact = await manager.findOne(CustomerContactEntity, {
        where: { tenantId, customerId: customer.id, isPrimary: true, isDeleted: false },
      });

      if (existingPrimaryContact) {
        existingPrimaryContact.contactName = persistedCustomer.legalName;
        existingPrimaryContact.email = persistedCustomer.email;
        existingPrimaryContact.phone = persistedCustomer.phone;
        existingPrimaryContact.updatedBy = dto.actorUserId;
        await manager.save(CustomerContactEntity, existingPrimaryContact);
      } else {
        const contact = manager.create(
          CustomerContactEntity,
          this.buildPrimaryContact(persistedCustomer, dto.actorUserId),
        );
        await manager.save(CustomerContactEntity, contact);
      }

      const interaction = manager.create(
        CustomerInteractionEntity,
        this.buildInteraction({
          tenantId: persistedCustomer.tenantId,
          customerId: persistedCustomer.id,
          actorUserId: dto.actorUserId,
          type:
            dto.status !== undefined && dto.status !== previousStatus
              ? CustomerInteractionType.STATUS_CHANGED
              : CustomerInteractionType.PROFILE_UPDATED,
          summary:
            dto.status !== undefined && dto.status !== previousStatus
              ? `Customer status changed to ${persistedCustomer.status}.`
              : 'Customer profile updated.',
          detail:
            dto.status !== undefined && dto.status !== previousStatus
              ? `Customer '${persistedCustomer.legalName}' changed from ${previousStatus} to ${persistedCustomer.status}.`
              : `Customer '${persistedCustomer.legalName}' was updated.`,
        }),
      );
      await manager.save(CustomerInteractionEntity, interaction);

      return persistedCustomer;
    });

    await this.auditService.record({
      tenantId: savedCustomer.tenantId,
      branchId: savedCustomer.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'customer',
      entityId: savedCustomer.id,
      action:
        savedCustomer.status !== previousStatus
          ? savedCustomer.status === CustomerStatus.INACTIVE
            ? 'customer.deactivated'
            : 'customer.reactivated'
          : 'customer.updated',
      eventType: 'crm.write',
      metadata: {
        previousStatus,
        currentStatus: savedCustomer.status,
      },
    });

    return savedCustomer;
  }

  async search(tenantId: string, filters: CustomerSearchFilters): Promise<CustomerEntity[]> {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      await this.assertBranch(tenantId, filters.branchId);
    }

    return this.customerRepository.search(tenantId, filters);
  }

  async getById(id: string, tenantId: string): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findById(id);
    if (!customer || customer.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Customer '${id}' was not found.`);
    }

    return customer;
  }

  async getProfile(tenantId: string, customerId: string): Promise<{
    customer: CustomerEntity;
    contacts: CustomerContactEntity[];
    interactions: CustomerInteractionEntity[];
    auditTrail: Awaited<ReturnType<AuditService['listByEntity']>>;
  }> {
    const customer = await this.getById(customerId, tenantId);
    const [contacts, interactions, auditTrail] = await Promise.all([
      this.customerContactRepository.findByCustomer(tenantId, customerId),
      this.customerInteractionRepository.findByCustomer(tenantId, customerId),
      this.auditService.listByEntity(tenantId, 'customer', customerId, 100),
    ]);

    return {
      customer,
      contacts,
      interactions,
      auditTrail,
    };
  }

  assertCustomerBranchAccess(customer: CustomerEntity, accessibleBranchIds: string[]): void {
    if (customer.branchId && !accessibleBranchIds.includes(customer.branchId)) {
      throw new ForbiddenException('Requested customer is outside the authenticated branch scope.');
    }
  }

  private async assertBranch(tenantId: string, branchId: string | null): Promise<void> {
    if (!branchId) {
      return;
    }

    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Customer branch must belong to the same tenant.');
    }
  }

  private normalizePhone(value: string): string {
    const normalized = value.replace(/\D/g, '');
    if (normalized.length < 10 || normalized.length > 13) {
      throw new DomainValidationError('Customer mobile phone / WhatsApp with DDD is required.');
    }

    return normalized;
  }

  private normalizeEmail(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    return value.trim().toLowerCase() || null;
  }

  private normalizeCpfOrCnpj(value: string | null | undefined, customerType: CustomerType): string | null {
    if (value == null || value === '') {
      return null;
    }

    const normalized = value.replace(/\D/g, '');
    if (customerType === CustomerType.COMPANY) {
      if (normalized.length !== 14) {
        throw new DomainValidationError('Company customers must use a 14-digit CNPJ.');
      }
      return normalized;
    }

    if (normalized.length !== 11) {
      throw new DomainValidationError('Person customers must use an 11-digit CPF.');
    }

    return normalized;
  }

  private normalizePostalCode(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\D/g, '');
    if (normalized.length !== 8) {
      throw new DomainValidationError('Postal code must contain 8 digits.');
    }

    return normalized;
  }

  private normalizeBirthDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const birthDate = new Date(value);
    if (Number.isNaN(birthDate.getTime())) {
      throw new DomainValidationError('Birth date is invalid.');
    }
    if (birthDate.getTime() > Date.now()) {
      throw new DomainValidationError('Birth date cannot be in the future.');
    }

    return value;
  }

  private buildPrimaryContact(customer: CustomerEntity, actorUserId: string): Partial<CustomerContactEntity> {
    return {
      id: randomUUID(),
      tenantId: customer.tenantId,
      customerId: customer.id,
      contactName: customer.legalName,
      contactRole: 'primary',
      email: customer.email,
      phone: customer.phone,
      isPrimary: true,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    };
  }

  private buildInteraction(input: {
    tenantId: string;
    customerId: string;
    actorUserId: string;
    type: CustomerInteractionType;
    summary: string;
    detail: string | null;
  }): Partial<CustomerInteractionEntity> {
    return {
      id: randomUUID(),
      tenantId: input.tenantId,
      customerId: input.customerId,
      serviceOrderId: null,
      interactionType: input.type,
      channel: InteractionChannel.SYSTEM,
      occurredAt: new Date(),
      summary: input.summary,
      detail: input.detail,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    };
  }
}
