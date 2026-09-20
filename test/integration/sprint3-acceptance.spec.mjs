import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { DataSource } = require('typeorm');

const DB_NAME = 'anexsys_sprint3_integration';
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT ?? 5432);
const DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';
const JWT_SECRET = process.env.JWT_SECRET ?? 'anexsys-integration-secret';

let app;
let baseUrl = '';
let tenantId = '';
let branchOneId = '';
let branchTwoId = '';
let customerId = '';
let branchTwoOrderId = '';
let serviceOrderId = '';
let adminToken = '';
let technicalUserId = '';

async function adminClient(database = 'postgres') {
  const client = new Client({ host: DB_HOST, port: DB_PORT, user: DB_USERNAME, password: DB_PASSWORD, database });
  await client.connect();
  return client;
}

async function http(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  return { status: response.status, json: await response.json() };
}

before(async () => {
  process.env.DB_HOST = DB_HOST;
  process.env.DB_PORT = String(DB_PORT);
  process.env.DB_USERNAME = DB_USERNAME;
  process.env.DB_PASSWORD = DB_PASSWORD;
  process.env.DB_NAME = DB_NAME;
  process.env.DB_SCHEMA = DB_SCHEMA;
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.PORT = '0';

  const bootstrapClient = await adminClient();
  await bootstrapClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [DB_NAME]);
  await bootstrapClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  await bootstrapClient.query(`CREATE DATABASE ${DB_NAME}`);
  await bootstrapClient.end();

  const dataSource = require('../../dist/platform/database/typeorm/data-source.js').default;
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  const { AppModule } = require('../../dist/app.module.js');
  const { DomainExceptionFilter } = require('../../dist/platform/http/domain-exception.filter.js');
  const { TenantService } = require('../../dist/modules/tenant/application/tenant/tenant.service.js');
  const { BranchService } = require('../../dist/modules/branch/application/branch/branch.service.js');
  const { IdentityService } = require('../../dist/modules/identity/application/identity/identity.service.js');
  const { AuthorizationService } = require('../../dist/modules/authorization/application/authorization/authorization.service.js');
  const { CustomerService } = require('../../dist/modules/crm/application/customer/customer.service.js');
  const { ServiceOrderService } = require('../../dist/modules/service-orders/application/service-order/service-order.service.js');
  const { BusinessCalendarDayEntity } = require('../../dist/modules/service-orders/infrastructure/persistence/entities/business-calendar-day.entity.js');
  const { CalendarDayScope } = require('../../dist/shared/domain/enums.js');

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  const tenantService = app.get(TenantService);
  const branchService = app.get(BranchService);
  const identityService = app.get(IdentityService);
  const authorizationService = app.get(AuthorizationService);
  const customerService = app.get(CustomerService);
  const serviceOrderService = app.get(ServiceOrderService);
  const bootstrapActorId = randomUUID();

  const tenant = await tenantService.create({ code: 'TENANTSO', legalName: 'Tenant SO Ltda', displayName: 'Tenant SO', actorUserId: bootstrapActorId });
  tenantId = tenant.id;

  const branchOne = await branchService.create({ tenantId, code: 'SO1', legalName: 'SO Branch 1', displayName: 'SO Branch 1', actorUserId: bootstrapActorId, businessCalendarName: 'Branch One Calendar' });
  branchOneId = branchOne.id;
  const branchTwo = await branchService.create({ tenantId, code: 'SO2', legalName: 'SO Branch 2', displayName: 'SO Branch 2', actorUserId: bootstrapActorId, businessCalendarName: 'Branch Two Calendar' });
  branchTwoId = branchTwo.id;

  const adminUser = await identityService.createUser({ tenantId, defaultBranchId: branchOneId, email: 'so-admin@tenant.test', displayName: 'SO Admin', password: 'SuperSecret123', actorUserId: bootstrapActorId });
  const technicalUser = await identityService.createUser({ tenantId, defaultBranchId: branchOneId, email: 'so-tech@tenant.test', displayName: 'SO Tech', password: 'SuperSecret123', actorUserId: bootstrapActorId });
  technicalUserId = technicalUser.id;

  const role = await authorizationService.createRole({ tenantId, code: 'SO_ADMIN', displayName: 'SO Admin', actorUserId: adminUser.id });
  for (const permissionCode of ['customers.read', 'customers.write', 'service_orders.read', 'service_orders.write']) {
    const permission = await authorizationService.createPermission({ tenantId, code: permissionCode, displayName: permissionCode, actorUserId: adminUser.id });
    await authorizationService.assignPermissionToRole({ tenantId, roleId: role.id, permissionId: permission.id, actorUserId: adminUser.id });
  }
  await authorizationService.assignRole({ tenantId, userId: adminUser.id, roleId: role.id, assignedBranchId: branchOneId, actorUserId: adminUser.id });
  await authorizationService.assignBranchScope({ tenantId, userId: adminUser.id, branchId: branchOneId, scopeType: 'admin', actorUserId: adminUser.id });

  const customer = await customerService.create({ tenantId, branchId: branchOneId, fullName: 'Service Order Customer', mobilePhone: '(11) 94444-2233', actorUserId: bootstrapActorId });
  customerId = customer.id;
  const branchTwoCustomer = await customerService.create({ tenantId, branchId: branchTwoId, fullName: 'Service Order Hidden Customer', mobilePhone: '(11) 93333-1122', actorUserId: bootstrapActorId });

  const data = app.get(DataSource);
  const calendarRepo = data.getRepository(BusinessCalendarDayEntity);
  await calendarRepo.insert([
    {
      id: randomUUID(), tenantId, branchId: null, scopeType: CalendarDayScope.TENANT, calendarDate: '2026-09-28', isWorkingDay: false, description: 'Tenant closed', isDeleted: false, deletedAt: null, deletedBy: null, createdBy: bootstrapActorId, updatedBy: bootstrapActorId,
    },
    {
      id: randomUUID(), tenantId, branchId: branchOneId, scopeType: CalendarDayScope.BRANCH, calendarDate: '2026-09-29', isWorkingDay: false, description: 'Branch inventory', isDeleted: false, deletedAt: null, deletedBy: null, createdBy: bootstrapActorId, updatedBy: bootstrapActorId,
    },
    {
      id: randomUUID(), tenantId, branchId: null, scopeType: CalendarDayScope.HOLIDAY, calendarDate: '2026-09-30', isWorkingDay: false, description: 'Holiday', isDeleted: false, deletedAt: null, deletedBy: null, createdBy: bootstrapActorId, updatedBy: bootstrapActorId,
    },
  ]);

  branchTwoOrderId = (await serviceOrderService.create({
    tenantId,
    branchId: branchTwoId,
    customerId: branchTwoCustomer.id,
    actorUserId: adminUser.id,
    commercialResponsibleActorId: adminUser.id,
    technicalMeasurementResponsibleActorId: technicalUser.id,
    items: [{ itemType: 'coat', description: 'Hidden Coat', quantity: 1, unitPrice: 30 }],
  })).serviceOrder.id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email: 'so-admin@tenant.test', password: 'SuperSecret123' }),
  });
  adminToken = login.json.accessToken;
});

after(async () => {
  if (app) {
    await app.close();
  }
  const cleanupClient = await adminClient();
  await cleanupClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [DB_NAME]);
  await cleanupClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  await cleanupClient.end();
});

describe('Sprint 3 acceptance', () => {
  it('creates service orders with auto-calculated promised delivery dates', async () => {
    const response = await http('/service-orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        branchId: branchOneId,
        customerId,
        technicalMeasurementResponsibleActorId: technicalUserId,
        deliveryCommitmentSourceAt: '2026-09-21T10:00:00.000Z',
        deliveryType: 'Priority',
        deliverySurchargeMethod: 'fixed',
        deliverySurchargeValue: 15,
        discountValue: 5,
        commercialNotes: 'VIP order',
        items: [{ itemType: 'shirt', description: 'Blue Shirt', quantity: 2, unitPrice: 50, discountValue: 10 }],
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(response.json.serviceOrder.promisedDeliveryDate, '2026-10-01');
    assert.equal(response.json.serviceOrder.totalValue, '100.00');
    serviceOrderId = response.json.serviceOrder.id;
  });

  it('lists and retrieves service order details with history and timeline', async () => {
    const list = await http('/service-orders?q=service', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(list.status, 200);
    assert.equal(list.json.some((order) => order.id === serviceOrderId), true);
    assert.equal(list.json.some((order) => order.id === branchTwoOrderId), false);

    const details = await http(`/service-orders/${serviceOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(details.status, 200);
    assert.equal(details.json.items.length, 1);
    assert.equal(details.json.serviceOrder.id, serviceOrderId);
    assert.equal(details.json.history.some((event) => event.action === 'service_order.created'), true);
    assert.equal(details.json.timeline.length > 0, true);
  });

  it('updates service order headers and item lifecycle changes', async () => {
    const updated = await http(`/service-orders/${serviceOrderId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ deliveryType: 'Express', operationalPriority: 'rush', customerNotes: 'Call before pickup' }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.json.deliveryType, 'Express');
    assert.equal(updated.json.customerNotes, 'Call before pickup');

    const createdItem = await http(`/service-orders/${serviceOrderId}/items`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ itemType: 'pants', description: 'Black Pants', quantity: 1, unitPrice: 80 }),
    });
    assert.equal(createdItem.status, 201);

    const patchedItem = await http(`/service-orders/${serviceOrderId}/items/${createdItem.json.id}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ status: 'cancelled', discountValue: 5 }),
    });
    assert.equal(patchedItem.status, 200);
    assert.equal(patchedItem.json.status, 'cancelled');
  });

  it('recalculates delivery dates and exposes the timeline endpoint', async () => {
    const { BusinessCalendarDayEntity } = require('../../dist/modules/service-orders/infrastructure/persistence/entities/business-calendar-day.entity.js');
    const data = app.get(DataSource);
    await data.getRepository(BusinessCalendarDayEntity).insert({
      id: randomUUID(), tenantId, branchId: null, scopeType: 'holiday', calendarDate: '2026-10-01', isWorkingDay: false, description: 'Follow-up holiday', isDeleted: false, deletedAt: null, deletedBy: null, createdBy: technicalUserId, updatedBy: technicalUserId,
    });

    const recalculated = await http(`/service-orders/${serviceOrderId}/delivery-date/recalculate`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(recalculated.status, 201);
    assert.equal(recalculated.json.promisedDeliveryDate, '2026-10-02');

    const timeline = await http(`/service-orders/${serviceOrderId}/timeline`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(timeline.status, 200);
    assert.equal(timeline.json.some((event) => event.action === 'service_order.delivery_date.recalculated'), true);
  });

  it('enforces branch scope on service order reads and writes', async () => {
    const hidden = await http(`/service-orders/${branchTwoOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(hidden.status, 403);

    const blockedCreate = await http('/service-orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        branchId: branchTwoId,
        customerId,
        items: [{ itemType: 'shirt', description: 'Blocked', quantity: 1 }],
      }),
    });
    assert.equal(blockedCreate.status, 403);
  });

  it('supports approve and cancel workflow actions', async () => {
    const approved = await http(`/service-orders/${serviceOrderId}/approve`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(approved.status, 201);
    assert.equal(approved.json.status, 'approved');

    const cancelled = await http(`/service-orders/${serviceOrderId}/cancel`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(cancelled.status, 201);
    assert.equal(cancelled.json.status, 'cancelled');
  });
});
