import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint4_integration';
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
let serviceOrderId = '';
let serviceOrderItemId = '';
let productionOrderId = '';
let primaryResourceId = '';
let secondaryResourceId = '';
let adminToken = '';

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

  const tenant = await tenantService.create({
    code: 'TENANTPO',
    legalName: 'Tenant Production Ltda',
    displayName: 'Tenant Production',
    actorUserId: bootstrapActorId,
  });
  tenantId = tenant.id;

  const branchOne = await branchService.create({
    tenantId,
    code: 'PO1',
    legalName: 'Production Branch 1',
    displayName: 'Production Branch 1',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Production 1',
  });
  branchOneId = branchOne.id;

  const branchTwo = await branchService.create({
    tenantId,
    code: 'PO2',
    legalName: 'Production Branch 2',
    displayName: 'Production Branch 2',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Production 2',
  });
  branchTwoId = branchTwo.id;

  const adminUser = await identityService.createUser({
    tenantId,
    defaultBranchId: branchOneId,
    email: 'po-admin@tenant.test',
    displayName: 'PO Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });
  const role = await authorizationService.createRole({
    tenantId,
    code: 'PO_ADMIN',
    displayName: 'PO Admin',
    actorUserId: adminUser.id,
  });
  for (const permissionCode of [
    'customers.read',
    'customers.write',
    'service_orders.read',
    'service_orders.write',
    'production_orders.read',
    'production_orders.write',
    'operational_resources.read',
    'operational_resources.write',
  ]) {
    const permission = await authorizationService.createPermission({
      tenantId,
      code: permissionCode,
      displayName: permissionCode,
      actorUserId: adminUser.id,
    });
    await authorizationService.assignPermissionToRole({
      tenantId,
      roleId: role.id,
      permissionId: permission.id,
      actorUserId: adminUser.id,
    });
  }
  await authorizationService.assignRole({
    tenantId,
    userId: adminUser.id,
    roleId: role.id,
    assignedBranchId: branchOneId,
    actorUserId: adminUser.id,
  });
  await authorizationService.assignBranchScope({
    tenantId,
    userId: adminUser.id,
    branchId: branchOneId,
    scopeType: 'admin',
    actorUserId: adminUser.id,
  });

  const customer = await customerService.create({
    tenantId,
    branchId: branchOneId,
    fullName: 'Production Customer',
    mobilePhone: '(11) 95555-1111',
    actorUserId: bootstrapActorId,
  });
  customerId = customer.id;

  const serviceOrder = await serviceOrderService.create({
    tenantId,
    branchId: branchOneId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: '2026-09-21T10:00:00.000Z',
    items: [{ itemType: 'shirt', description: 'Blue Shirt', quantity: 2, unitPrice: 50 }],
  });
  serviceOrderId = serviceOrder.serviceOrder.id;
  serviceOrderItemId = serviceOrder.items[0].id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email: 'po-admin@tenant.test', password: 'SuperSecret123' }),
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

describe('Sprint 4 acceptance', () => {
  it('creates operational resources and manages skills and availability', async () => {
    const primary = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchOneId,
        resourceType: 'employee',
        displayName: 'Maria Costureira',
        skills: ['sewing'],
      }),
    });
    assert.equal(primary.status, 201);
    primaryResourceId = primary.json.id;

    const secondary = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchOneId,
        resourceType: 'contractor',
        displayName: 'Joao Acabamento',
        skills: ['finishing'],
      }),
    });
    assert.equal(secondary.status, 201);
    secondaryResourceId = secondary.json.id;

    const skillUpdate = await http(`/operational-resources/${primaryResourceId}/skills`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ skills: ['quality-check', 'sewing'] }),
    });
    assert.equal(skillUpdate.status, 201);
    assert.equal(skillUpdate.json.skillProfile.includes('quality-check'), true);

    const availability = await http(`/operational-resources/${secondaryResourceId}/availability`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        availabilityStatus: 'available',
        availableFrom: '2026-09-22',
        availableUntil: '2026-09-30',
        availabilityNotes: 'Weekday coverage',
      }),
    });
    assert.equal(availability.status, 200);
    assert.equal(availability.json.availableUntil, '2026-09-30');
  });

  it('generates a primary production order from a service order', async () => {
    const generated = await http(`/service-orders/${serviceOrderId}/production-order/generate`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(generated.status, 201);
    productionOrderId = generated.json.productionOrder.id;
    assert.equal(generated.json.productionOrder.serviceOrderId, serviceOrderId);
    assert.equal(generated.json.items.length, 1);
  });

  it('lists details, schedules assignments, and runs lifecycle transitions', async () => {
    const scheduled = await http(`/production-orders/${productionOrderId}/schedule`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        scheduledStartAt: '2026-09-23T08:00:00.000Z',
        scheduledEndAt: '2026-09-23T17:00:00.000Z',
        primaryResourceId,
        participantResourceIds: [secondaryResourceId],
        assignmentNotes: 'Main floor team',
      }),
    });
    assert.equal(scheduled.status, 201);
    assert.equal(scheduled.json.status, 'scheduled');

    const started = await http(`/production-orders/${productionOrderId}/start`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ operationalResourceId: primaryResourceId, diaryEntry: 'Started cutting' }),
    });
    assert.equal(started.status, 201);
    assert.equal(started.json.status, 'in_progress');

    const paused = await http(`/production-orders/${productionOrderId}/pause`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ diaryEntry: 'Machine maintenance' }),
    });
    assert.equal(paused.status, 201);
    assert.equal(paused.json.status, 'paused');

    const completed = await http(`/production-orders/${productionOrderId}/complete`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ producedQuantity: 2, diaryEntry: 'Completed and released' }),
    });
    assert.equal(completed.status, 201);
    assert.equal(completed.json.status, 'completed');
    assert.equal(completed.json.producedQuantity, '2.0000');

    const details = await http(`/production-orders/${productionOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(details.status, 200);
    assert.equal(details.json.assignments.length >= 2, true);
    assert.equal(details.json.history.some((event) => event.action === 'production_order.completed'), true);
  });

  it('creates corrective production versions and exposes a financially clean print view', async () => {
    const version = await http(`/production-orders/${productionOrderId}/versions`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        versionReason: 'rework',
        changeSummary: 'Redo stitching on sleeve',
        operationalPriority: 'urgent',
        affectedServiceOrderItemIds: [serviceOrderItemId],
      }),
    });
    assert.equal(version.status, 201);
    assert.equal(version.json.versionNo, 2);

    const versions = await http(`/production-orders/${productionOrderId}/versions`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(versions.status, 200);
    assert.equal(versions.json[0].versionReason, 'rework');

    const printView = await http(`/production-orders/${productionOrderId}/print-view`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(printView.status, 200);
    assert.equal(printView.json.indicators.includes('[ REWORK ]'), true);
    assert.equal('totalValue' in printView.json, false);
    assert.equal('discountValue' in printView.json, false);
  });

  it('lists production orders and resource assignments while enforcing branch scope', async () => {
    const list = await http('/production-orders', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(list.status, 200);
    assert.equal(list.json.some((order) => order.id === productionOrderId), true);

    const assignments = await http(`/operational-resources/${primaryResourceId}/assignments`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(assignments.status, 200);
    assert.equal(assignments.json.some((assignment) => assignment.productionOrderId === productionOrderId), true);

    const blocked = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchTwoId,
        resourceType: 'employee',
        displayName: 'Blocked Branch User',
      }),
    });
    assert.equal(blocked.status, 403);
  });
});
