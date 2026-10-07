import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeliveryType, UserStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';

function buildDataSource() {
  return {
    async transaction(callback: (manager: any) => Promise<unknown>) {
      const manager = {
        create(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
        async save(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
      };
      return callback(manager);
    },
  };
}

function piece(overrides: Record<string, unknown> = {}) {
  return {
    itemType: 'uniform',
    description: 'Jacket',
    quantity: 1,
    brand: 'Levi',
    model: '501',
    serialNo: 'SN-1',
    ...overrides,
  };
}

describe('ServiceOrderService', () => {
  it('creates a service order with default commercial responsibility and calculated totals', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; }, async nextGroupSeq() { return 2; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; }, async suggestDeliveryDate() { return '2026-10-01'; } } as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      promisedDeliveryTime: '18:00',
      deliveryType: DeliveryType.PRIORITY,
      deliverySurchargeMethod: 'fixed' as never,
      deliverySurchargeValue: 15,
      discountValue: 5,
      items: [
        piece({ quantity: 2, unitPrice: 50, discountValue: 10 }),
      ],
    });

    assert.equal(created.serviceOrder.commercialResponsibleActorId, 'user-1');
    assert.equal(created.serviceOrder.promisedDeliveryDate, '2026-10-01');
    assert.equal(created.serviceOrder.promisedDeliveryTime, '18:00');
    assert.equal(created.serviceOrder.orderNo, 'AAA000002');
    assert.equal(created.serviceOrder.bagClosed, false);
    assert.equal(created.items[0]?.itemType, 'uniform');
    assert.equal(created.items[0]?.description, 'Jacket');
    assert.equal(created.items[0]?.quantity, '1.0000');
    assert.equal(created.items[0]?.brand, 'Levi');
    assert.equal(created.items[0]?.model, '501');
    assert.equal(created.items[0]?.serialNo, 'SN-1');
    assert.equal(created.items[0]?.discountValue, '10.00');
    assert.equal(audits[0]?.action, 'service_order.created');
  });

  it('stores the promised delivery time as HH:MM when the suggestion includes seconds', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; }, async nextGroupSeq() { return 2; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-14', promisedDeliveryTime: '18:00:00' }; } } as never,
      { async record() {}, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      promisedDeliveryTime: '18:00:00',
      items: [piece({ itemType: 'uniform', description: 'Calça', unitPrice: 40 })],
    });

    assert.equal(created.serviceOrder.promisedDeliveryTime, '18:00');
  });

  it('normalizes service order items before persistence and total calculation', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; }, async nextGroupSeq() { return 2; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; }, async suggestDeliveryDate() { return '2026-10-01'; } } as never,
      { async record() {}, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      items: [
        piece({ itemType: '  uniform  ', description: '  Jacket  ', quantity: 2, unitPrice: undefined, discountValue: undefined, deliveryType: undefined, operationalPriority: '   ', brand: '  Levi  ', model: '  501  ', serialNo: '  SN-1  ' }),
      ],
    });

    assert.equal(created.items[0]?.itemType, 'uniform');
    assert.equal(created.items[0]?.description, 'Jacket');
    assert.equal(created.items[0]?.brand, 'Levi');
    assert.equal(created.items[0]?.model, '501');
    assert.equal(created.items[0]?.serialNo, 'SN-1');
    assert.equal(created.items[0]?.unitPrice, null);
    assert.equal(created.items[0]?.discountValue, '0.00');
    assert.equal(created.items[0]?.deliveryType, null);
    assert.equal(created.items[0]?.operationalPriority, null);
    assert.equal(created.serviceOrder.totalValue, null);
  });

  it('rejects a branch-scoped customer from another branch', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-2' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; }, async suggestDeliveryDate() { return '2026-10-01'; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          customerId: 'customer-1',
          actorUserId: 'user-1',
          items: [piece()],
        }),
      DomainValidationError,
    );
  });

  it('rejects a piece without brand', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          customerId: 'customer-1',
          actorUserId: 'user-1',
          items: [piece({ brand: '   ' })],
        }),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /marca/);
        return true;
      },
    );
  });

  it('saves a piece with brand and empty model and serial', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; }, async nextGroupSeq() { return 2; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; } } as never,
      { async record() {}, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      items: [piece({ model: '', serialNo: '  ' })],
    });
    assert.equal(created.items[0]?.brand, 'Levi');
    assert.equal(created.items[0]?.model, '');
    assert.equal(created.items[0]?.serialNo, '');
  });

  it('prints the service order with values and keeps internal notes out', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { async findById() { return { id: 'so-1', tenantId: 'tenant-1', customerId: 'customer-1', commercialResponsibleActorId: 'user-1', technicalMeasurementResponsibleActorId: 'user-1', orderNo: 'OS-1', status: 'open', openedAt: '2026-10-07T10:00:00.000Z', promisedDeliveryDate: '2026-10-14', promisedDeliveryTime: '18:00', deliveryType: DeliveryType.STANDARD, totalValue: '90.00', customerNotes: 'Garantia 90 dias', commercialNotes: 'nao imprimir' }; }, async findByGroupId() { return []; } } as never,
      { async findByServiceOrder() { return [{ id: 'item-1', itemNo: 1, itemType: 'Calça', description: 'Bainha', complement: 'Barra 4 cm', brand: 'Levi', model: '501', serialNo: 'SN-1', quantity: '1', unitPrice: '90.00', discountValue: '0.00', status: 'open', isDeleted: false }]; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', legalName: 'Maria Silva', phone: '11988887777', email: 'maria@test.com' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-14', promisedDeliveryTime: '18:00' }; } } as never,
      { async listByEntity() { return []; } } as never,
      {} as never,
    );

    const printView = await service.getPrintView('tenant-1', 'so-1');
    assert.equal(printView.orderNo, 'OS-1');
    assert.equal(printView.totalValue, '90.00');
    assert.equal(printView.items[0]?.subtotal, '90.00');
    assert.equal(printView.items[0]?.brand, 'Levi');
    assert.equal(printView.items[0]?.model, '501');
    assert.equal(printView.items[0]?.serialNo, 'SN-1');
    assert.equal(printView.customerNotes, 'Garantia 90 dias');
    assert.equal('commercialNotes' in printView, false);
  });

  it('rejects more than five pieces on a service order', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          customerId: 'customer-1',
          actorUserId: 'user-1',
          items: Array.from({ length: 6 }, (_, index) => piece({
            itemType: `Peca ${index + 1}`,
            description: 'Bainha',
            serialNo: `SN-${index + 1}`,
          })),
        }),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /Feche a sacola/);
        return true;
      },
    );
  });

  it('respects a parametrized piece limit smaller than the default', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      { async getById() { return { id: 'tenant-1', maxPiecesPerBag: 3 }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          customerId: 'customer-1',
          actorUserId: 'user-1',
          items: Array.from({ length: 4 }, (_, index) => piece({
            itemType: `Peca ${index + 1}`,
            description: 'Bainha',
            serialNo: `SN-${index + 1}`,
          })),
        }),
      DomainValidationError,
    );
  });

  it('spawns the next linked OS version with the same header and an A suffix', async () => {
    const saved: Array<Record<string, unknown>> = [];
    const source = {
      id: 'so-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      groupId: 'so-1',
      groupSeq: 2,
      versionSuffix: null,
      orderNo: '00002',
      bagClosed: true,
      status: 'open',
      deliveryCommitmentSourceAt: new Date('2026-10-07T10:00:00.000Z'),
      promisedDeliveryDate: '2026-10-14',
      promisedDeliveryTime: '18:00',
      paymentTermsDays: 0,
      deliveryType: DeliveryType.STANDARD,
      operationalPriority: null,
      commercialResponsibleActorId: 'user-1',
      technicalMeasurementResponsibleActorId: 'user-1',
      deliverySurchargeMethod: null,
      deliverySurchargeValue: null,
      commercialNotes: 'interno',
      customerNotes: 'Garantia 90 dias',
    };
    const service = new ServiceOrderService(
      buildDataSource() as never,
      {
        async findById(id: string) {
          return id === 'so-2' ? saved[0] : source;
        },
        async findByGroupId() {
          return [source];
        },
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          saved.push({ ...payload, id: 'so-2' });
          return saved[0];
        },
      } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1', maxPiecesPerBag: 5 }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      {} as never,
      { async record() {}, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const spawned = await service.spawnNextVersion('tenant-1', 'so-1', 'user-1');
    assert.equal(saved[0]?.orderNo, '00002-A');
    assert.equal(saved[0]?.versionSuffix, 'A');
    assert.equal(saved[0]?.bagClosed, false);
    assert.equal(saved[0]?.customerId, 'customer-1');
    assert.equal(saved[0]?.customerNotes, 'Garantia 90 dias');
    assert.equal(spawned.serviceOrder.orderNo, '00002-A');
  });

  it('rejects spawning the next version before the bag is closed', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      {
        async findById() {
          return { id: 'so-1', tenantId: 'tenant-1', bagClosed: false };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () => service.spawnNextVersion('tenant-1', 'so-1', 'user-1'),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /Feche a sacola/);
        return true;
      },
    );
  });

  it('closes the bag, locks the version and refuses later piece edits', async () => {
    const source = {
      id: 'so-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      bagClosed: false,
      status: 'open',
      orderNo: 'AAA000001',
      groupId: 'so-1',
    };
    const saved: Array<Record<string, unknown>> = [];
    const service = new ServiceOrderService(
      buildDataSource() as never,
      {
        async findById() {
          return saved[0] ?? source;
        },
        async findByGroupId() {
          return [saved[0] ?? source];
        },
        async save(payload: Record<string, unknown>) {
          saved.push({ ...source, ...payload });
          return saved[saved.length - 1];
        },
      } as never,
      {
        async findByServiceOrder() {
          return [{ id: 'item-1', itemNo: 1, status: 'open', isDeleted: false, quantity: '1.0000', unitPrice: '40.00', discountValue: '0.00' }];
        },
      } as never,
      { async getById() { return { id: 'tenant-1', maxPiecesPerBag: 5 }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      {} as never,
      { async record() {}, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const closed = await service.closeBag('tenant-1', 'so-1', 'user-1');
    assert.equal(saved[0]?.bagClosed, true);
    assert.equal(closed.serviceOrder.bagClosed, true);

    await assert.rejects(
      () => service.closeBag('tenant-1', 'so-1', 'user-1'),
      DomainValidationError,
    );
    await assert.rejects(
      () =>
        service.update('so-1', 'tenant-1', {
          actorUserId: 'user-1',
          customerNotes: 'nao pode',
        }),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /já está fechada/);
        return true;
      },
    );
    await assert.rejects(
      () =>
        service.addItem({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          serviceOrderId: 'so-1',
          actorUserId: 'user-1',
          itemType: 'Calça',
          description: 'Bainha',
          quantity: 1,
        }),
      DomainValidationError,
    );

    const reopened = await service.reopenBag('tenant-1', 'so-1', 'user-1');
    assert.equal(saved[saved.length - 1]?.bagClosed, false);
    assert.equal(reopened.serviceOrder.bagClosed, false);
  });

  it('rejects reopening a bag that is already open', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      {
        async findById() {
          return { id: 'so-1', tenantId: 'tenant-1', bagClosed: false, status: 'open' };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () => service.reopenBag('tenant-1', 'so-1', 'user-1'),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /já está aberta/);
        return true;
      },
    );
  });

  it('refuses floor advance while the bag is open', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      {
        async findById() {
          return { id: 'so-1', tenantId: 'tenant-1', status: 'open', bagClosed: false, branchId: 'branch-1' };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () => service.advanceFloor('tenant-1', 'so-1', 'user-1'),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /próximo passo/);
        return true;
      },
    );
  });

  it('refuses reopening the bag after production started', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      {
        async findById() {
          return { id: 'so-1', tenantId: 'tenant-1', status: 'in_production', bagClosed: true };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () => service.reopenBag('tenant-1', 'so-1', 'user-1'),
      (error: unknown) => {
        assert.ok(error instanceof DomainValidationError);
        assert.match(error.message, /produção começou/);
        return true;
      },
    );
  });
});
