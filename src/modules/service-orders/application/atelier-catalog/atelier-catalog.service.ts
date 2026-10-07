import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { AtelierServiceEntity } from '../../infrastructure/persistence/entities/atelier-service.entity';
import { GarmentProductEntity } from '../../infrastructure/persistence/entities/garment-product.entity';
import { AtelierServiceRepository } from '../../infrastructure/persistence/repositories/atelier-service.repository';
import { GarmentProductRepository } from '../../infrastructure/persistence/repositories/garment-product.repository';

export const DEFAULT_GARMENT_PRODUCTS = [
  'Calça',
  'Saia',
  'Vestido de festa',
  'Vestido',
  'Terno',
  'Paletó',
  'Camisa',
  'Jaqueta',
] as const;

export const DEFAULT_ATELIER_SERVICES = [
  'Bainha',
  'Ajuste lateral',
  'Ajuste de cintura',
  'Barra',
  'Troca de zíper',
] as const;

@Injectable()
export class AtelierCatalogService {
  constructor(
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(GarmentProductRepository)
    private readonly productRepository: GarmentProductRepository,
    @Inject(AtelierServiceRepository)
    private readonly serviceRepository: AtelierServiceRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(DependencyValidationService)
    private readonly dependencyValidationService: DependencyValidationService,
  ) {}

  async listProducts(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.productRepository.findListedByTenant(tenantId);
  }

  async listActiveProducts(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.productRepository.findActiveByTenant(tenantId);
  }

  async listServices(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.serviceRepository.findListedByTenant(tenantId);
  }

  async listActiveServices(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.serviceRepository.findActiveByTenant(tenantId);
  }

  async getProduct(tenantId: string, id: string) {
    const entity = await this.productRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) {
      throw new EntityNotFoundError('O produto não foi encontrado.');
    }
    return entity;
  }

  async getService(tenantId: string, id: string) {
    const entity = await this.serviceRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) {
      throw new EntityNotFoundError('O serviço não foi encontrado.');
    }
    return entity;
  }

  async createProduct(input: { tenantId: string; displayName: string; actorUserId: string; sortOrder?: number }) {
    await this.tenantService.getById(input.tenantId);
    const displayName = input.displayName.trim();
    if (!displayName) {
      throw new DomainValidationError('O nome do produto é obrigatório.');
    }

    const code = this.normalizeCode(displayName);
    const existing = await this.productRepository.findByTenantAndCode(input.tenantId, code);
    if (existing) {
      throw new DomainValidationError(`Já existe o produto '${displayName}'.`);
    }

    const saved = await this.productRepository.save(
      this.productRepository.create({
        id: randomUUID(),
        tenantId: input.tenantId,
        code,
        displayName,
        sortOrder: input.sortOrder ?? 0,
        status: MeasurementCatalogStatus.ACTIVE,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      }),
    );
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'garment_product',
      entityId: saved.id,
      action: 'atelier.product.created',
      eventType: 'service_order.write',
      metadata: { code: saved.code },
    });
    return saved;
  }

  async updateProduct(
    id: string,
    input: {
      tenantId: string;
      displayName?: string;
      sortOrder?: number;
      status?: MeasurementCatalogStatus;
      actorUserId: string;
    },
  ) {
    const entity = await this.getProduct(input.tenantId, id);
    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new DomainValidationError('O nome do produto é obrigatório.');
      }
      const code = this.normalizeCode(displayName);
      const existing = await this.productRepository.findByTenantAndCode(input.tenantId, code);
      if (existing && existing.id !== entity.id) {
        throw new DomainValidationError(`Já existe o produto '${displayName}'.`);
      }
      entity.displayName = displayName;
      entity.code = code;
    }
    if (input.sortOrder !== undefined) {
      entity.sortOrder = input.sortOrder;
    }
    if (input.status !== undefined) {
      entity.status = input.status;
    }
    entity.updatedBy = input.actorUserId;
    const saved = await this.productRepository.save(entity);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'garment_product',
      entityId: saved.id,
      action: 'atelier.product.updated',
      eventType: 'service_order.write',
      metadata: { code: saved.code },
    });
    return saved;
  }

  async removeProduct(id: string, tenantId: string, actorUserId: string): Promise<void> {
    const entity = await this.getProduct(tenantId, id);
    await this.dependencyValidationService.assertGarmentProductCanDelete(tenantId, id);
    entity.isDeleted = true;
    entity.deletedAt = new Date();
    entity.deletedBy = actorUserId;
    entity.updatedBy = actorUserId;
    await this.productRepository.save(entity);
    await this.auditService.record({
      tenantId,
      actorUserId,
      entityType: 'garment_product',
      entityId: entity.id,
      action: 'atelier.product.deleted',
      eventType: 'service_order.write',
      metadata: { code: entity.code },
    });
  }

  async createService(input: {
    tenantId: string;
    displayName: string;
    defaultPrice?: number | null;
    actorUserId: string;
    sortOrder?: number;
  }) {
    await this.tenantService.getById(input.tenantId);
    const displayName = input.displayName.trim();
    if (!displayName) {
      throw new DomainValidationError('O nome do serviço é obrigatório.');
    }

    const code = this.normalizeCode(displayName);
    const existing = await this.serviceRepository.findByTenantAndCode(input.tenantId, code);
    if (existing) {
      throw new DomainValidationError(`Já existe o serviço '${displayName}'.`);
    }

    const saved = await this.serviceRepository.save(
      this.serviceRepository.create({
        id: randomUUID(),
        tenantId: input.tenantId,
        code,
        displayName,
        defaultPrice: this.formatOptionalMoney(input.defaultPrice),
        sortOrder: input.sortOrder ?? 0,
        status: MeasurementCatalogStatus.ACTIVE,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      }),
    );
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'atelier_service',
      entityId: saved.id,
      action: 'atelier.service.created',
      eventType: 'service_order.write',
      metadata: { code: saved.code },
    });
    return saved;
  }

  async updateService(
    id: string,
    input: {
      tenantId: string;
      displayName?: string;
      defaultPrice?: number | null;
      sortOrder?: number;
      status?: MeasurementCatalogStatus;
      actorUserId: string;
    },
  ) {
    const entity = await this.getService(input.tenantId, id);
    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new DomainValidationError('O nome do serviço é obrigatório.');
      }
      const code = this.normalizeCode(displayName);
      const existing = await this.serviceRepository.findByTenantAndCode(input.tenantId, code);
      if (existing && existing.id !== entity.id) {
        throw new DomainValidationError(`Já existe o serviço '${displayName}'.`);
      }
      entity.displayName = displayName;
      entity.code = code;
    }
    if (input.defaultPrice !== undefined) {
      entity.defaultPrice = this.formatOptionalMoney(input.defaultPrice);
    }
    if (input.sortOrder !== undefined) {
      entity.sortOrder = input.sortOrder;
    }
    if (input.status !== undefined) {
      entity.status = input.status;
    }
    entity.updatedBy = input.actorUserId;
    const saved = await this.serviceRepository.save(entity);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'atelier_service',
      entityId: saved.id,
      action: 'atelier.service.updated',
      eventType: 'service_order.write',
      metadata: { code: saved.code },
    });
    return saved;
  }

  async removeService(id: string, tenantId: string, actorUserId: string): Promise<void> {
    const entity = await this.getService(tenantId, id);
    await this.dependencyValidationService.assertAtelierServiceCanDelete(tenantId, id);
    entity.isDeleted = true;
    entity.deletedAt = new Date();
    entity.deletedBy = actorUserId;
    entity.updatedBy = actorUserId;
    await this.serviceRepository.save(entity);
    await this.auditService.record({
      tenantId,
      actorUserId,
      entityType: 'atelier_service',
      entityId: entity.id,
      action: 'atelier.service.deleted',
      eventType: 'service_order.write',
      metadata: { code: entity.code },
    });
  }

  async resolveActiveProduct(tenantId: string, productId: string, actorUserId: string): Promise<GarmentProductEntity> {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    const [product] = await this.productRepository.findByIds(tenantId, [productId]);
    if (!product) {
      throw new DomainValidationError('O produto está inativo ou não pertence a esta Conta.');
    }
    return product;
  }

  async resolveActiveService(tenantId: string, serviceId: string, actorUserId: string): Promise<AtelierServiceEntity> {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    const [service] = await this.serviceRepository.findByIds(tenantId, [serviceId]);
    if (!service) {
      throw new DomainValidationError('O serviço está inativo ou não pertence a esta Conta.');
    }
    return service;
  }

  private async ensureTenantDefaults(tenantId: string, actorUserId: string) {
    await this.tenantService.getById(tenantId);
    const [listedProducts, listedServices, existingProductCodes, existingServiceCodes] = await Promise.all([
      this.productRepository.findListedByTenant(tenantId),
      this.serviceRepository.findListedByTenant(tenantId),
      this.productRepository.findCodesByTenant(tenantId),
      this.serviceRepository.findCodesByTenant(tenantId),
    ]);

    const knownProductCodes = new Set(existingProductCodes);
    const missingProducts = DEFAULT_GARMENT_PRODUCTS.filter((item) => !knownProductCodes.has(this.normalizeCode(item)));
    if (missingProducts.length > 0) {
      await this.productRepository.saveMany(
        missingProducts.map((item, index) =>
          this.productRepository.create({
            id: randomUUID(),
            tenantId,
            code: this.normalizeCode(item),
            displayName: item,
            sortOrder: listedProducts.length + index + 1,
            status: MeasurementCatalogStatus.ACTIVE,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
          }),
        ),
      );
    }

    const knownServiceCodes = new Set(existingServiceCodes);
    const missingServices = DEFAULT_ATELIER_SERVICES.filter((item) => !knownServiceCodes.has(this.normalizeCode(item)));
    if (missingServices.length > 0) {
      await this.serviceRepository.saveMany(
        missingServices.map((item, index) =>
          this.serviceRepository.create({
            id: randomUUID(),
            tenantId,
            code: this.normalizeCode(item),
            displayName: item,
            defaultPrice: null,
            sortOrder: listedServices.length + index + 1,
            status: MeasurementCatalogStatus.ACTIVE,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
          }),
        ),
      );
    }
  }

  private formatOptionalMoney(value: number | null | undefined) {
    if (value === null || value === undefined) {
      return null;
    }
    return value.toFixed(2);
  }

  private normalizeCode(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }
}
