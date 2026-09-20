import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { CreateTenantDto } from 'src/modules/tenant/contracts/dto/create-tenant.dto';
import { UpdateTenantDto } from 'src/modules/tenant/contracts/dto/update-tenant.dto';
import { TenantStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { TenantEntity } from '../../infrastructure/persistence/entities/tenant.entity';
import { TenantRepository } from '../../infrastructure/persistence/repositories/tenant.repository';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantEntity> {
    const existing = await this.tenantRepository.findByCode(dto.code);
    if (existing) {
      throw new DomainValidationError(`Tenant code '${dto.code}' already exists.`);
    }

    const tenant = this.tenantRepository.create({
      id: randomUUID(),
      code: dto.code.trim().toUpperCase(),
      legalName: dto.legalName.trim(),
      displayName: dto.displayName.trim(),
      status: TenantStatus.ACTIVE,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const saved = await this.tenantRepository.save(tenant);
    await this.auditService.record({
      tenantId: saved.id,
      actorUserId: dto.actorUserId,
      entityType: 'tenant',
      entityId: saved.id,
      action: 'tenant.created',
      eventType: 'governance.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async list(): Promise<TenantEntity[]> {
    return this.tenantRepository.findAll();
  }

  async getById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new EntityNotFoundError(`Tenant '${id}' was not found.`);
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantEntity> {
    const tenant = await this.getById(id);

    if (dto.code && dto.code.toUpperCase() !== tenant.code) {
      const existing = await this.tenantRepository.findByCode(dto.code.toUpperCase());
      if (existing && existing.id !== id) {
        throw new DomainValidationError(`Tenant code '${dto.code}' already exists.`);
      }
      tenant.code = dto.code.trim().toUpperCase();
    }

    tenant.legalName = dto.legalName?.trim() ?? tenant.legalName;
    tenant.displayName = dto.displayName?.trim() ?? tenant.displayName;
    tenant.updatedBy = dto.actorUserId;

    const saved = await this.tenantRepository.save(tenant);
    await this.auditService.record({
      tenantId: saved.id,
      actorUserId: dto.actorUserId,
      entityType: 'tenant',
      entityId: saved.id,
      action: 'tenant.updated',
      eventType: 'governance.write',
    });

    return saved;
  }

  async activate(id: string, actorUserId: string): Promise<TenantEntity> {
    return this.setStatus(id, TenantStatus.ACTIVE, actorUserId, 'tenant.activated');
  }

  async deactivate(id: string, actorUserId: string): Promise<TenantEntity> {
    return this.setStatus(id, TenantStatus.INACTIVE, actorUserId, 'tenant.deactivated');
  }

  private async setStatus(
    id: string,
    status: TenantStatus,
    actorUserId: string,
    action: string,
  ): Promise<TenantEntity> {
    const tenant = await this.getById(id);
    tenant.status = status;
    tenant.updatedBy = actorUserId;

    const saved = await this.tenantRepository.save(tenant);
    await this.auditService.record({
      tenantId: saved.id,
      actorUserId,
      entityType: 'tenant',
      entityId: saved.id,
      action,
      eventType: 'governance.write',
      metadata: { status },
    });

    return saved;
  }
}
