import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CompanyEntity } from '../../infrastructure/persistence/entities/company.entity';
import { CompanyRepository } from '../../infrastructure/persistence/repositories/company.repository';
import { DEFAULT_BRANCH_CODE, DEFAULT_BRANCH_DISPLAY_NAME, DEFAULT_BRANCH_TIMEZONE } from '../company.defaults';

export type CreateCompanyInput = {
  tenantId: string;
  legalName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  createDefaultBranch?: boolean;
  actorUserId: string;
};

@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly tenantService: TenantService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
    private readonly auditService: AuditService,
  ) {}

  async create(input: CreateCompanyInput): Promise<CompanyEntity> {
    await this.tenantService.getById(input.tenantId);
    const legalName = input.legalName.trim();
    if (!legalName) {
      throw new DomainValidationError('Company legal name is required.');
    }
    const cnpj = this.normalizeCnpj(input.cnpj);
    if (cnpj) {
      const existing = await this.companyRepository.findByTenantAndCnpj(input.tenantId, cnpj);
      if (existing) {
        throw new DomainValidationError('Another company with the same CNPJ already exists in this account.');
      }
    }

    const existingCompanies = await this.companyRepository.findByTenant(input.tenantId);
    const company = this.companyRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      legalName,
      tradeName: input.tradeName?.trim() || null,
      cnpj,
      isDefault: existingCompanies.length === 0,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    });
    const saved = await this.companyRepository.save(company);

    if (input.createDefaultBranch !== false) {
      const existingBranches = await this.branchService.listByCompany(input.tenantId, saved.id);
      if (existingBranches.length === 0) {
        await this.branchService.create({
          tenantId: input.tenantId,
          companyId: saved.id,
          code: DEFAULT_BRANCH_CODE,
          legalName,
          displayName: DEFAULT_BRANCH_DISPLAY_NAME,
          timezone: DEFAULT_BRANCH_TIMEZONE,
          isDefault: true,
          actorUserId: input.actorUserId,
        });
      }
    }

    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'company',
      entityId: saved.id,
      action: 'company.created',
      eventType: 'governance.write',
      metadata: { cnpj: saved.cnpj, isDefault: saved.isDefault },
    });

    return saved;
  }

  async listByTenant(tenantId: string): Promise<CompanyEntity[]> {
    await this.tenantService.getById(tenantId);
    return this.companyRepository.findByTenant(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<CompanyEntity> {
    const company = await this.companyRepository.findById(id);
    if (!company || company.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Company '${id}' was not found.`);
    }
    return company;
  }

  async getOrCreateDefault(tenantId: string, actorUserId: string): Promise<CompanyEntity> {
    const existing = await this.companyRepository.findDefaultByTenant(tenantId);
    if (existing) {
      return existing;
    }
    const listed = await this.companyRepository.findByTenant(tenantId);
    if (listed[0]) {
      return listed[0];
    }
    const tenant = await this.tenantService.getById(tenantId);
    return this.create({
      tenantId,
      legalName: tenant.legalName,
      tradeName: tenant.displayName,
      createDefaultBranch: false,
      actorUserId,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: { legalName?: string; tradeName?: string | null; cnpj?: string | null; actorUserId: string },
  ): Promise<CompanyEntity> {
    const company = await this.getById(id, tenantId);
    if (dto.legalName !== undefined) {
      const legalName = dto.legalName.trim();
      if (!legalName) {
        throw new DomainValidationError('Company legal name is required.');
      }
      company.legalName = legalName;
    }
    if (dto.tradeName !== undefined) {
      company.tradeName = dto.tradeName?.trim() || null;
    }
    if (dto.cnpj !== undefined) {
      const cnpj = this.normalizeCnpj(dto.cnpj);
      if (cnpj) {
        const existing = await this.companyRepository.findByTenantAndCnpj(tenantId, cnpj);
        if (existing && existing.id !== company.id) {
          throw new DomainValidationError('Another company with the same CNPJ already exists in this account.');
        }
      }
      company.cnpj = cnpj;
    }
    company.updatedBy = dto.actorUserId;
    return this.companyRepository.save(company);
  }

  private normalizeCnpj(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    if (digits.length !== 14) {
      throw new DomainValidationError('CNPJ must contain 14 digits.');
    }
    return digits;
  }
}
