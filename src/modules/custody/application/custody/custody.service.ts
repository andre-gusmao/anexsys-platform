import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { CustodyEventStage, StorageLocationStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { AssignStorageLocationDto } from '../../contracts/dto/assign-storage-location.dto';
import { CreateStorageLocationDto } from '../../contracts/dto/create-storage-location.dto';
import { RecordCustodyEventDto } from '../../contracts/dto/record-custody-event.dto';
import { SearchCustodyEventsDto } from '../../contracts/dto/search-custody-events.dto';
import { SearchStorageLocationsDto } from '../../contracts/dto/search-storage-locations.dto';
import { UpdateStorageLocationDto } from '../../contracts/dto/update-storage-location.dto';
import { CameraSnapshotEntity } from '../../infrastructure/persistence/entities/camera-snapshot.entity';
import { CctvReferenceEntity } from '../../infrastructure/persistence/entities/cctv-reference.entity';
import { CustodyEventEntity } from '../../infrastructure/persistence/entities/custody-event.entity';
import { PhysicalBagSupportContextEntity } from '../../infrastructure/persistence/entities/physical-bag-support-context.entity';
import { StorageLocationAssignmentEntity } from '../../infrastructure/persistence/entities/storage-location-assignment.entity';
import { StorageLocationEntity } from '../../infrastructure/persistence/entities/storage-location.entity';
import { CameraSnapshotRepository } from '../../infrastructure/persistence/repositories/camera-snapshot.repository';
import { CctvReferenceRepository } from '../../infrastructure/persistence/repositories/cctv-reference.repository';
import { CustodyEventRepository } from '../../infrastructure/persistence/repositories/custody-event.repository';
import { PhysicalBagSupportContextRepository } from '../../infrastructure/persistence/repositories/physical-bag-support-context.repository';
import { StorageLocationAssignmentRepository } from '../../infrastructure/persistence/repositories/storage-location-assignment.repository';
import { StorageLocationRepository } from '../../infrastructure/persistence/repositories/storage-location.repository';

@Injectable()
export class CustodyService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly serviceOrderService: ServiceOrderService,
    private readonly productionOrderService: ProductionOrderService,
    private readonly operationalResourceService: OperationalResourceService,
    private readonly storageLocationRepository: StorageLocationRepository,
    private readonly storageLocationAssignmentRepository: StorageLocationAssignmentRepository,
    private readonly bagSupportContextRepository: PhysicalBagSupportContextRepository,
    private readonly custodyEventRepository: CustodyEventRepository,
    private readonly cctvReferenceRepository: CctvReferenceRepository,
    private readonly cameraSnapshotRepository: CameraSnapshotRepository,
    private readonly auditService: AuditService,
  ) {}

  async searchStorageLocations(tenantId: string, filters: SearchStorageLocationsDto) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    return this.storageLocationRepository.search(tenantId, filters);
  }

  async createStorageLocation(dto: CreateStorageLocationDto): Promise<StorageLocationEntity> {
    await this.tenantService.getById(dto.tenantId);
    const branch = await this.branchService.getById(dto.branchId);
    if (branch.tenantId !== dto.tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    const normalized = this.normalizeLocationHierarchy(dto);
    const existing = await this.storageLocationRepository.findByHierarchy(dto.tenantId, dto.branchId, normalized.area, normalized.corridor, normalized.rowCode, normalized.shelfCode, normalized.cabinetCode, normalized.drawerCode);
    if (existing) throw new DomainValidationError('Storage location already exists for this branch and hierarchy.');
    const entity = this.storageLocationRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      ...normalized,
      displayLabel: dto.displayLabel?.trim() || this.buildDisplayLabel(normalized),
      status: dto.status ?? StorageLocationStatus.ACTIVE,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.storageLocationRepository.save(entity);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: dto.branchId, actorUserId: dto.actorUserId, entityType: 'storage_location', entityId: saved.id, action: 'storage_location.created', eventType: 'custody.write', metadata: { displayLabel: saved.displayLabel } });
    return saved;
  }

  async updateStorageLocation(locationId: string, dto: UpdateStorageLocationDto): Promise<StorageLocationEntity> {
    await this.tenantService.getById(dto.tenantId);
    const location = await this.getStorageLocationById(locationId, dto.tenantId);
    const normalized = this.normalizeLocationHierarchy(dto);
    const existing = await this.storageLocationRepository.findByHierarchy(dto.tenantId, location.branchId, normalized.area, normalized.corridor, normalized.rowCode, normalized.shelfCode, normalized.cabinetCode, normalized.drawerCode);
    if (existing && existing.id !== location.id) throw new DomainValidationError('Storage location already exists for this branch and hierarchy.');
    Object.assign(location, normalized, {
      displayLabel: dto.displayLabel?.trim() || this.buildDisplayLabel(normalized),
      status: dto.status ?? location.status,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.storageLocationRepository.save(location);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: location.branchId, actorUserId: dto.actorUserId, entityType: 'storage_location', entityId: saved.id, action: 'storage_location.updated', eventType: 'custody.write', metadata: { displayLabel: saved.displayLabel, status: saved.status } });
    return saved;
  }

  async getStorageLocationById(locationId: string, tenantId: string): Promise<StorageLocationEntity> {
    const location = await this.storageLocationRepository.findById(locationId);
    if (!location || location.tenantId !== tenantId || location.isDeleted) throw new EntityNotFoundError(`Storage Location '${locationId}' was not found.`);
    return location;
  }

  async assignStorageLocation(dto: AssignStorageLocationDto) {
    const serviceOrder = await this.serviceOrderService.getById(dto.serviceOrderId, dto.tenantId);
    const location = await this.getStorageLocationById(dto.storageLocationId, dto.tenantId);
    if (serviceOrder.branchId !== location.branchId) throw new DomainValidationError('Storage Location must belong to the same branch as the Service Order.');
    const assignedAt = dto.assignedAt ? new Date(dto.assignedAt) : new Date();
    const current = await this.storageLocationAssignmentRepository.findCurrentByServiceOrder(dto.serviceOrderId);
    if (current && current.tenantId !== dto.tenantId) throw new DomainValidationError('Current storage assignment belongs to a different tenant.');
    if (current) {
      current.isCurrent = false;
      current.releasedAt = assignedAt;
      current.updatedBy = dto.actorUserId;
      await this.storageLocationAssignmentRepository.save(current);
    }
    const assignment = this.storageLocationAssignmentRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: serviceOrder.branchId,
      serviceOrderId: serviceOrder.id,
      storageLocationId: location.id,
      assignedAt,
      releasedAt: null,
      isCurrent: true,
      assignmentReason: dto.assignmentReason?.trim() || null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const savedAssignment = await this.storageLocationAssignmentRepository.save(assignment);
    await this.syncBagSupportContext({ ...dto, branchId: serviceOrder.branchId, assignmentId: savedAssignment.id });
    const custodyEvent = await this.recordCustodyEvent({
      tenantId: dto.tenantId,
      actorUserId: dto.actorUserId,
      branchId: serviceOrder.branchId,
      serviceOrderId: serviceOrder.id,
      productionOrderId: dto.productionOrderId,
      storageLocationId: location.id,
      eventStage: CustodyEventStage.STORAGE,
      notes: dto.assignmentReason,
      evidenceSummary: { locationAssignmentId: savedAssignment.id, displayLabel: location.displayLabel },
    });
    await this.auditService.record({ tenantId: dto.tenantId, branchId: serviceOrder.branchId, actorUserId: dto.actorUserId, entityType: 'storage_location_assignment', entityId: savedAssignment.id, action: 'storage_location.assigned', eventType: 'custody.write', metadata: { serviceOrderId: serviceOrder.id, storageLocationId: location.id, custodyEventId: custodyEvent.id } });
    return this.getServiceOrderLocation(dto.tenantId, dto.serviceOrderId);
  }

  async getServiceOrderLocation(tenantId: string, serviceOrderId: string) {
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    const current = await this.storageLocationAssignmentRepository.findCurrentByServiceOrder(serviceOrderId);
    const latestHistoricalAssignment = current ? null : (await this.storageLocationAssignmentRepository.findHistoryByServiceOrder(serviceOrderId))[0] ?? null;
    const selectedAssignment = current ?? latestHistoricalAssignment;
    if (!selectedAssignment) {
      return { serviceOrder, currentAssignment: null, latestHistoricalAssignment: null, location: null, bagSupportContext: null };
    }
    const location = await this.getStorageLocationById(selectedAssignment.storageLocationId, tenantId);
    const bagContexts = await this.listBagSupportContexts(serviceOrderId);
    const bagSupportContext = bagContexts.find((item) => item.storageLocationAssignmentId === selectedAssignment.id) ?? null;
    return { serviceOrder, currentAssignment: current, latestHistoricalAssignment, location, bagSupportContext };
  }

  async listServiceOrderLocationHistory(tenantId: string, serviceOrderId: string) {
    await this.serviceOrderService.getById(serviceOrderId, tenantId);
    const history = await this.storageLocationAssignmentRepository.findHistoryByServiceOrder(serviceOrderId);
    const bagContexts = await this.listBagSupportContexts(serviceOrderId);
    const locations = await Promise.all(history.map((assignment) => this.getStorageLocationById(assignment.storageLocationId, tenantId)));
    return history.map((assignment, index) => ({
      assignment,
      location: locations[index],
      bagSupportContext: bagContexts.find((item) => item.storageLocationAssignmentId === assignment.id) ?? null,
    }));
  }

  async searchCustodyEvents(tenantId: string, filters: SearchCustodyEventsDto) {
    await this.tenantService.getById(tenantId);
    return this.custodyEventRepository.search(tenantId, filters);
  }

  async getCustodyEventById(tenantId: string, custodyEventId: string) {
    const custodyEvent = await this.custodyEventRepository.findById(custodyEventId);
    if (!custodyEvent || custodyEvent.tenantId !== tenantId) throw new EntityNotFoundError(`Custody Event '${custodyEventId}' was not found.`);
    const cctvReferences = await this.cctvReferenceRepository.findByCustodyEvent(custodyEvent.id);
    const cameraSnapshots = await this.cameraSnapshotRepository.findByCustodyEvent(custodyEvent.id);
    return { custodyEvent, cctvReferences, cameraSnapshots };
  }

  async recordCustodyEvent(dto: RecordCustodyEventDto): Promise<CustodyEventEntity> {
    await this.tenantService.getById(dto.tenantId);
    const serviceOrder = dto.serviceOrderId ? await this.serviceOrderService.getById(dto.serviceOrderId, dto.tenantId) : null;
    const productionOrder = dto.productionOrderId ? await this.productionOrderService.getById(dto.productionOrderId, dto.tenantId) : null;
    if (!serviceOrder && !productionOrder && !dto.pickupAuthorizationId) throw new DomainValidationError('Custody Events require at least one business lineage reference.');
    const derivedServiceOrderId = productionOrder?.serviceOrderId ?? null;
    if (serviceOrder && derivedServiceOrderId && serviceOrder.id !== derivedServiceOrderId) throw new DomainValidationError('Production Order must belong to the same Service Order lineage.');
    if (!serviceOrder && productionOrder) {
      const linkedServiceOrder = await this.serviceOrderService.getById(productionOrder.serviceOrderId, dto.tenantId);
      if (linkedServiceOrder.branchId !== dto.branchId) throw new DomainValidationError('Branch must match the linked Service Order branch.');
    }
    if (serviceOrder && serviceOrder.branchId !== dto.branchId) throw new DomainValidationError('Branch must match the Service Order branch.');
    if (productionOrder && productionOrder.branchId !== dto.branchId) throw new DomainValidationError('Branch must match the Production Order branch.');
    if (dto.operationalResourceId) await this.operationalResourceService.getById(dto.operationalResourceId, dto.tenantId);
    if (dto.storageLocationId) {
      const location = await this.getStorageLocationById(dto.storageLocationId, dto.tenantId);
      if (location.branchId !== dto.branchId) throw new DomainValidationError('Storage Location must belong to the same branch as the custody event.');
    }
    const event = this.custodyEventRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      serviceOrderId: serviceOrder?.id ?? productionOrder?.serviceOrderId ?? null,
      productionOrderId: productionOrder?.id ?? null,
      pickupAuthorizationId: dto.pickupAuthorizationId ?? null,
      operationalResourceId: dto.operationalResourceId ?? null,
      storageLocationId: dto.storageLocationId ?? null,
      eventStage: dto.eventStage,
      eventAt: dto.eventAt ? new Date(dto.eventAt) : new Date(),
      actorId: dto.actorUserId,
      notes: dto.notes?.trim() || null,
      evidenceSummary: dto.evidenceSummary ?? null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.custodyEventRepository.save(event);
    await this.attachEvidence(saved, dto);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: dto.branchId, actorUserId: dto.actorUserId, entityType: 'custody_event', entityId: saved.id, action: 'custody_event.recorded', eventType: 'custody.traceability', metadata: { eventStage: saved.eventStage, serviceOrderId: saved.serviceOrderId, pickupAuthorizationId: saved.pickupAuthorizationId } });
    return saved;
  }

  private async syncBagSupportContext(input: AssignStorageLocationDto & { branchId: string; assignmentId: string }) {
    if (input.productionOrderId) {
      const productionOrder = await this.productionOrderService.getById(input.productionOrderId, input.tenantId);
      if (productionOrder.serviceOrderId !== input.serviceOrderId) throw new DomainValidationError('Bag support context Production Order must belong to the same Service Order.');
    }
    const existing = await this.bagSupportContextRepository.findCurrentByServiceOrder(input.serviceOrderId);
    const hasExplicitBagLabel = input.bagLabel !== undefined;
    const hasExplicitBagNotes = input.bagNotes !== undefined;
    const hasExplicitInUse = input.bagInUse !== undefined;
    const nextBagLabel = hasExplicitBagLabel ? input.bagLabel?.trim() || null : existing?.bagLabel ?? null;
    const nextBagNotes = hasExplicitBagNotes ? input.bagNotes?.trim() || null : existing?.notes ?? null;
    const nextProductionOrderId = input.productionOrderId ?? existing?.productionOrderId ?? null;
    const nextInUse = hasExplicitInUse ? Boolean(input.bagInUse) : existing?.inUse ?? Boolean(nextBagLabel || nextBagNotes || nextProductionOrderId);

    if (existing) {
      existing.inUse = false;
      existing.updatedBy = input.actorUserId;
      await this.bagSupportContextRepository.save(existing);
    }

    if (!nextInUse && !nextBagLabel && !nextBagNotes && !nextProductionOrderId) return null;

    const entity = this.bagSupportContextRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      branchId: input.branchId,
      serviceOrderId: input.serviceOrderId,
      productionOrderId: nextProductionOrderId,
      storageLocationAssignmentId: input.assignmentId,
      bagLabel: nextBagLabel,
      notes: nextBagNotes,
      inUse: nextInUse,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    } as Partial<PhysicalBagSupportContextEntity>);
    return this.bagSupportContextRepository.save(entity);
  }

  private async attachEvidence(event: CustodyEventEntity, dto: RecordCustodyEventDto): Promise<void> {
    const actorUserId = dto.actorUserId;
    const createdAt = event.eventAt;
    for (const snapshot of dto.cameraSnapshots ?? []) {
      const entity = this.cameraSnapshotRepository.create({ id: randomUUID(), tenantId: dto.tenantId, custodyEventId: event.id, capturedAt: snapshot.capturedAt ? new Date(snapshot.capturedAt) : createdAt, referenceUri: snapshot.referenceUri.trim(), notes: snapshot.notes?.trim() || null, createdBy: actorUserId, updatedBy: actorUserId });
      await this.cameraSnapshotRepository.save(entity as CameraSnapshotEntity);
    }
    for (const reference of dto.cctvReferences ?? []) {
      const entity = this.cctvReferenceRepository.create({ id: randomUUID(), tenantId: dto.tenantId, custodyEventId: event.id, sourceLabel: reference.sourceLabel.trim(), capturedAt: reference.capturedAt ? new Date(reference.capturedAt) : createdAt, referenceUri: reference.referenceUri.trim(), notes: reference.notes?.trim() || null, createdBy: actorUserId, updatedBy: actorUserId });
      await this.cctvReferenceRepository.save(entity as CctvReferenceEntity);
    }
  }

  private normalizeLocationHierarchy(input: Partial<CreateStorageLocationDto & UpdateStorageLocationDto>) {
    const area = input.area?.trim() || null;
    const corridor = input.corridor?.trim() || null;
    const rowCode = input.rowCode?.trim() || null;
    const shelfCode = input.shelfCode?.trim() || null;
    const cabinetCode = input.cabinetCode?.trim() || null;
    const drawerCode = input.drawerCode?.trim() || null;
    if (!area && !corridor && !rowCode && !shelfCode && !cabinetCode && !drawerCode) throw new DomainValidationError('Storage Location hierarchy requires at least one physical coordinate.');
    return { area, corridor, rowCode, shelfCode, cabinetCode, drawerCode };
  }

  private buildDisplayLabel(parts: { area: string | null; corridor: string | null; rowCode: string | null; shelfCode: string | null; cabinetCode: string | null; drawerCode: string | null }) {
    return [parts.area && `Area ${parts.area}`, parts.corridor && `Corridor ${parts.corridor}`, parts.rowCode && `Row ${parts.rowCode}`, parts.shelfCode && `Shelf ${parts.shelfCode}`, parts.cabinetCode && `Cabinet ${parts.cabinetCode}`, parts.drawerCode && `Drawer ${parts.drawerCode}`].filter(Boolean).join(' / ');
  }

  private async listBagSupportContexts(serviceOrderId: string) {
    if (typeof (this.bagSupportContextRepository as { findByServiceOrder?: unknown }).findByServiceOrder === 'function') {
      return (this.bagSupportContextRepository as { findByServiceOrder(serviceOrderId: string): Promise<PhysicalBagSupportContextEntity[]> }).findByServiceOrder(serviceOrderId);
    }
    const current = await this.bagSupportContextRepository.findCurrentByServiceOrder(serviceOrderId);
    return current ? [current] : [];
  }
}
