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

export type CompanyFiscalInput = {
  legalName?: string;
  tradeName?: string | null;
  cnpj?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type CreateCompanyInput = CompanyFiscalInput & {
  tenantId: string;
  legalName: string;
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
      throw new DomainValidationError('A razão social é obrigatória.');
    }
    const profile = this.normalizeFiscalProfile(input);
    if (profile.cnpj) {
      const existing = await this.companyRepository.findByTenantAndCnpj(input.tenantId, profile.cnpj);
      if (existing) {
        throw new DomainValidationError('Já existe uma empresa com este CNPJ nesta Conta.');
      }
    }

    const existingCompanies = await this.companyRepository.findByTenant(input.tenantId);
    const company = this.companyRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      legalName,
      ...profile,
      country: profile.country ?? 'BR',
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
    dto: CompanyFiscalInput & { actorUserId: string },
  ): Promise<CompanyEntity> {
    const company = await this.getById(id, tenantId);
    if (dto.legalName !== undefined) {
      const legalName = dto.legalName.trim();
      if (!legalName) {
        throw new DomainValidationError('A razão social é obrigatória.');
      }
      company.legalName = legalName;
    }
    const profile = this.normalizeFiscalProfile(dto);
    if (dto.tradeName !== undefined) {
      company.tradeName = profile.tradeName;
    }
    if (dto.cnpj !== undefined) {
      if (profile.cnpj) {
        const existing = await this.companyRepository.findByTenantAndCnpj(tenantId, profile.cnpj);
        if (existing && existing.id !== company.id) {
          throw new DomainValidationError('Já existe uma empresa com este CNPJ nesta Conta.');
        }
      }
      company.cnpj = profile.cnpj;
    }
    if (dto.stateRegistration !== undefined) {
      company.stateRegistration = profile.stateRegistration;
    }
    if (dto.municipalRegistration !== undefined) {
      company.municipalRegistration = profile.municipalRegistration;
    }
    if (dto.email !== undefined) {
      company.email = profile.email;
    }
    if (dto.phone !== undefined) {
      company.phone = profile.phone;
    }
    if (dto.postalCode !== undefined) {
      company.postalCode = profile.postalCode;
    }
    if (dto.street !== undefined) {
      company.street = profile.street;
    }
    if (dto.number !== undefined) {
      company.number = profile.number;
    }
    if (dto.complement !== undefined) {
      company.complement = profile.complement;
    }
    if (dto.district !== undefined) {
      company.district = profile.district;
    }
    if (dto.city !== undefined) {
      company.city = profile.city;
    }
    if (dto.state !== undefined) {
      company.state = profile.state;
    }
    if (dto.country !== undefined) {
      company.country = profile.country;
    }
    company.updatedBy = dto.actorUserId;
    return this.companyRepository.save(company);
  }

  private normalizeFiscalProfile(input: CompanyFiscalInput) {
    return {
      tradeName: this.normalizeOptionalText(input.tradeName),
      cnpj: this.normalizeCnpj(input.cnpj),
      stateRegistration: this.normalizeOptionalText(input.stateRegistration),
      municipalRegistration: this.normalizeOptionalText(input.municipalRegistration),
      email: this.normalizeEmail(input.email),
      phone: this.normalizeOptionalText(input.phone),
      postalCode: this.normalizePostalCode(input.postalCode),
      street: this.normalizeOptionalText(input.street),
      number: this.normalizeOptionalText(input.number),
      complement: this.normalizeOptionalText(input.complement),
      district: this.normalizeOptionalText(input.district),
      city: this.normalizeOptionalText(input.city),
      state: this.normalizeState(input.state),
      country: this.normalizeOptionalText(input.country),
    };
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed || null;
  }

  private normalizeEmail(value?: string | null): string | null {
    const email = this.normalizeOptionalText(value);
    return email ? email.toLowerCase() : null;
  }

  private normalizePostalCode(value?: string | null): string | null {
    if (value === undefined || value === null || !value.trim()) {
      return null;
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new DomainValidationError('O CEP deve ter 8 dígitos.');
    }
    return digits;
  }

  private normalizeState(value?: string | null): string | null {
    const state = this.normalizeOptionalText(value);
    return state ? state.toUpperCase() : null;
  }

  private normalizeCnpj(value?: string | null): string | null {
    if (value === undefined || value === null || !value.trim()) {
      return null;
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) {
      throw new DomainValidationError('O CNPJ deve ter 14 dígitos.');
    }
    if (!this.isValidCnpj(digits)) {
      throw new DomainValidationError('O CNPJ informado é inválido.');
    }
    return digits;
  }

  private isValidCnpj(value: string): boolean {
    if (!/^\d{14}$/.test(value) || /^(\d)\1{13}$/.test(value)) {
      return false;
    }

    const digits = value.split('').map(Number);
    const firstCheck = this.calculateWeightedCheckDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const secondCheck = this.calculateWeightedCheckDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return firstCheck === digits[12] && secondCheck === digits[13];
  }

  private calculateWeightedCheckDigit(baseDigits: number[], weights: number[]): number {
    const sum = baseDigits.reduce((total, digit, index) => total + digit * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}
