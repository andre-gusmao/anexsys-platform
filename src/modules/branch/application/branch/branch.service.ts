import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { CompanyService } from 'src/modules/company/application/company/company.service';
import { BranchHoursService } from 'src/modules/company/application/company/branch-hours.service';
import { DEFAULT_BRANCH_TIMEZONE } from 'src/modules/company/application/company.defaults';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { BranchStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CreateBranchDto } from '../../contracts/dto/create-branch.dto';
import { UpdateBranchDto } from '../../contracts/dto/update-branch.dto';
import { BranchEntity } from '../../infrastructure/persistence/entities/branch.entity';
import { BranchRepository } from '../../infrastructure/persistence/repositories/branch.repository';

@Injectable()
export class BranchService {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly tenantService: TenantService,
    private readonly auditService: AuditService,
    private readonly dependencyValidationService: DependencyValidationService,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    @Inject(forwardRef(() => BranchHoursService))
    private readonly branchHoursService: BranchHoursService,
  ) {}

  async create(dto: CreateBranchDto): Promise<BranchEntity> {
    await this.tenantService.getById(dto.tenantId);
    await this.assertParentBranch(dto.tenantId, dto.parentBranchId ?? null);

    const companyId = dto.companyId ?? (await this.companyService.getOrCreateDefault(dto.tenantId, dto.actorUserId)).id;
    const company = await this.companyService.getById(companyId, dto.tenantId);

    const normalizedCode = dto.code.trim().toUpperCase();
    const existingBranch = await this.branchRepository.findByTenantAndCode(dto.tenantId, normalizedCode);
    if (existingBranch) {
      throw new DomainValidationError(`Branch code '${normalizedCode}' already exists for this tenant.`);
    }

    const siblings = await this.branchRepository.findByCompany(dto.tenantId, company.id);
    const isDefault = dto.isDefault ?? siblings.length === 0;

    const branch = this.branchRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      companyId: company.id,
      code: normalizedCode,
      legalName: dto.legalName.trim(),
      displayName: dto.displayName.trim(),
      status: BranchStatus.ACTIVE,
      parentBranchId: dto.parentBranchId ?? null,
      businessCalendarName: dto.businessCalendarName?.trim() || null,
      timezone: dto.timezone?.trim() || DEFAULT_BRANCH_TIMEZONE,
      isDefault,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const saved = await this.branchRepository.save(branch);
    await this.branchHoursService.seedDefaults(dto.tenantId, saved.id, dto.actorUserId);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: saved.id,
      actorUserId: dto.actorUserId,
      entityType: 'branch',
      entityId: saved.id,
      action: 'branch.created',
      eventType: 'governance.write',
      metadata: { code: saved.code, companyId: saved.companyId, isDefault: saved.isDefault },
      newValues: this.buildAuditSnapshot(saved),
    });

    return saved;
  }

  async listByTenant(tenantId: string): Promise<BranchEntity[]> {
    await this.tenantService.getById(tenantId);
    return this.branchRepository.findByTenant(tenantId);
  }

  async listByCompany(tenantId: string, companyId: string): Promise<BranchEntity[]> {
    return this.branchRepository.findByCompany(tenantId, companyId);
  }

  async getById(id: string): Promise<BranchEntity> {
    const branch = await this.branchRepository.findById(id);
    if (!branch) {
      throw new EntityNotFoundError(`Branch '${id}' was not found.`);
    }

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto): Promise<BranchEntity> {
    const branch = await this.getById(id);
    const previousValues = this.buildAuditSnapshot(branch);
    await this.assertParentBranch(branch.tenantId, dto.parentBranchId ?? branch.parentBranchId, id);

    if (dto.code && dto.code.trim().toUpperCase() !== branch.code) {
      const normalizedCode = dto.code.trim().toUpperCase();
      const existingBranch = await this.branchRepository.findByTenantAndCode(branch.tenantId, normalizedCode);
      if (existingBranch && existingBranch.id !== id) {
        throw new DomainValidationError(`Branch code '${normalizedCode}' already exists for this tenant.`);
      }
      branch.code = normalizedCode;
    }

    branch.legalName = dto.legalName?.trim() ?? branch.legalName;
    branch.displayName = dto.displayName?.trim() ?? branch.displayName;
    branch.parentBranchId = dto.parentBranchId === undefined ? branch.parentBranchId : dto.parentBranchId;
    branch.businessCalendarName =
      dto.businessCalendarName === undefined
        ? branch.businessCalendarName
        : dto.businessCalendarName?.trim() || null;
    if (dto.timezone !== undefined) {
      branch.timezone = dto.timezone.trim() || DEFAULT_BRANCH_TIMEZONE;
    }
    if (dto.companyId !== undefined) {
      const company = await this.companyService.getById(dto.companyId, branch.tenantId);
      branch.companyId = company.id;
    }
    branch.updatedBy = dto.actorUserId;

    const saved = await this.branchRepository.save(branch);
    await this.auditService.record({
      tenantId: saved.tenantId,
      branchId: saved.id,
      actorUserId: dto.actorUserId,
      entityType: 'branch',
      entityId: saved.id,
      action: 'branch.updated',
      eventType: 'governance.write',
      previousValues,
      newValues: this.buildAuditSnapshot(saved),
    });

    return saved;
  }

  async activate(id: string, actorUserId: string): Promise<BranchEntity> {
    return this.setStatus(id, BranchStatus.ACTIVE, actorUserId, 'branch.activated');
  }

  async deactivate(id: string, actorUserId: string): Promise<BranchEntity> {
    return this.setStatus(id, BranchStatus.INACTIVE, actorUserId, 'branch.deactivated');
  }

  async listChildren(parentBranchId: string): Promise<BranchEntity[]> {
    await this.getById(parentBranchId);
    return this.branchRepository.findChildren(parentBranchId);
  }

  private async setStatus(
    id: string,
    status: BranchStatus,
    actorUserId: string,
    action: string,
  ): Promise<BranchEntity> {
    const branch = await this.getById(id);
    if (status === BranchStatus.INACTIVE) {
      await this.dependencyValidationService.assertBranchCanDeactivate(id);
    }
    const previousValues = this.buildAuditSnapshot(branch);
    branch.status = status;
    branch.updatedBy = actorUserId;

    const saved = await this.branchRepository.save(branch);
    await this.auditService.record({
      tenantId: saved.tenantId,
      branchId: saved.id,
      actorUserId,
      entityType: 'branch',
      entityId: saved.id,
      action,
      eventType: 'governance.write',
      metadata: { status },
      previousValues,
      newValues: this.buildAuditSnapshot(saved),
    });

    return saved;
  }

  private async assertParentBranch(tenantId: string, parentBranchId: string | null, branchId?: string): Promise<void> {
    if (!parentBranchId) {
      return;
    }

    if (branchId && branchId === parentBranchId) {
      throw new DomainValidationError('Branch cannot be its own parent.');
    }

    const parentBranch = await this.getById(parentBranchId);
    if (parentBranch.tenantId !== tenantId) {
      throw new DomainValidationError('Parent branch must belong to the same tenant.');
    }
  }

  private buildAuditSnapshot(branch: BranchEntity) {
    return {
      tenantId: branch.tenantId,
      code: branch.code,
      legalName: branch.legalName,
      displayName: branch.displayName,
      status: branch.status,
      parentBranchId: branch.parentBranchId,
      businessCalendarName: branch.businessCalendarName,
      companyId: branch.companyId,
      timezone: branch.timezone,
      isDefault: branch.isDefault,
    };
  }
}
