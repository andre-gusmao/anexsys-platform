import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint5_integration';
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT ?? 5432);
const DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';
const JWT_SECRET = process.env.JWT_SECRET ?? 'anexsys-integration-secret';

let app;
let baseUrl = '';
let tenantId = '';
let branchId = '';
let customerId = '';
let serviceOrderId = '';
let productionOrderId = '';
let operationalResourceId = '';
let adminToken = '';
let activeQrCodeValue = '';
let reissuedQrCodeValue = '';

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
    code: 'TENANTQR',
    legalName: 'Tenant QR Ltda',
    displayName: 'Tenant QR',
    actorUserId: bootstrapActorId,
  });
  tenantId = tenant.id;

  const branch = await branchService.create({
    tenantId,
    code: 'QR1',
    legalName: 'QR Branch',
    displayName: 'QR Branch',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'QR Calendar',
  });
  branchId = branch.id;

  const adminUser = await identityService.createUser({
    tenantId,
    defaultBranchId: branchId,
    email: 'qr-admin@tenant.test',
    displayName: 'QR Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const role = await authorizationService.createRole({
    tenantId,
    code: 'QR_ADMIN',
    displayName: 'QR Admin',
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
    assignedBranchId: branchId,
    actorUserId: adminUser.id,
  });
  await authorizationService.assignBranchScope({
    tenantId,
    userId: adminUser.id,
    branchId,
    scopeType: 'admin',
    actorUserId: adminUser.id,
  });

  const customer = await customerService.create({
    tenantId,
    branchId,
    fullName: 'QR Customer',
    mobilePhone: '(11) 94444-1111',
    actorUserId: bootstrapActorId,
  });
  customerId = customer.id;

  const serviceOrder = await serviceOrderService.create({
    tenantId,
    branchId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: '2026-09-21T10:00:00.000Z',
    items: [{ itemType: 'shirt', description: 'Red Shirt', quantity: 2, unitPrice: 40 }],
  });
  serviceOrderId = serviceOrder.serviceOrder.id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email: 'qr-admin@tenant.test', password: 'SuperSecret123' }),
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

describe('Sprint 5 acceptance', () => {
  it('creates the production root and exposes the active production-order QR code', async () => {
    const resource = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchId,
        resourceType: 'employee',
        displayName: 'Maria QR',
        skills: ['sewing'],
      }),
    });
    assert.equal(resource.status, 201);
    operationalResourceId = resource.json.id;

    const generated = await http(`/service-orders/${serviceOrderId}/production-order/generate`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(generated.status, 201);
    productionOrderId = generated.json.productionOrder.id;
    assert.equal(generated.json.activeQrCode.reissueNo, 1);
    activeQrCodeValue = generated.json.activeQrCode.codeValue;

    const qr = await http(`/production-orders/${productionOrderId}/qr`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(qr.status, 200);
    assert.equal(qr.json.codeValue, activeQrCodeValue);
  });

  it('supports QR-driven execution start, diary updates, status changes, and queryable traceability', async () => {
    const started = await http('/qr-events/scan', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        codeValue: activeQrCodeValue,
        scanType: 'start_execution',
        operationalResourceId,
        diaryEntry: 'Started via scanner',
        deviceInfo: 'android-phone',
      }),
    });
    assert.equal(started.status, 201);
    assert.equal(started.json.productionOrder.status, 'in_progress');
    assert.equal(started.json.qrEvent.scanResult, 'accepted');

    const diary = await http('/qr-events/scan', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        codeValue: activeQrCodeValue,
        scanType: 'update_diary',
        operationalResourceId,
        diaryEntry: 'Moved to finishing bench',
        deviceInfo: 'android-phone',
      }),
    });
    assert.equal(diary.status, 201);
    assert.equal(diary.json.productionOrder.status, 'in_progress');

    const paused = await http('/qr-events/scan', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        codeValue: activeQrCodeValue,
        scanType: 'update_status',
        targetStatus: 'paused',
        diaryEntry: 'Paused for adjustment',
      }),
    });
    assert.equal(paused.status, 201);
    assert.equal(paused.json.productionOrder.status, 'paused');

    const completed = await http('/qr-events/scan', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        codeValue: activeQrCodeValue,
        scanType: 'update_status',
        targetStatus: 'completed',
        diaryEntry: 'Completed from mobile scanner',
      }),
    });
    assert.equal(completed.status, 201);
    assert.equal(completed.json.productionOrder.status, 'completed');

    const details = await http(`/production-orders/${productionOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(details.status, 200);
    assert.equal(details.json.executionEvents.length >= 4, true);
    assert.equal(details.json.operationalDiary.some((entry) => entry.diaryEntry === 'Moved to finishing bench'), true);

    const productionOrderQrEvents = await http(`/production-orders/${productionOrderId}/qr-events`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(productionOrderQrEvents.status, 200);
    assert.equal(productionOrderQrEvents.json.length >= 4, true);

    const allQrEvents = await http(`/qr-events?productionOrderId=${productionOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(allQrEvents.status, 200);
    assert.equal(allQrEvents.json.every((event) => event.scanResult === 'accepted'), true);
  });

  it('reissues the production-order QR code and blocks further scans on the old code', async () => {
    const reissued = await http(`/production-orders/${productionOrderId}/qr/reissue`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(reissued.status, 201);
    assert.equal(reissued.json.reissueNo, 2);
    reissuedQrCodeValue = reissued.json.codeValue;
    assert.notEqual(reissuedQrCodeValue, activeQrCodeValue);

    const oldScan = await http('/qr-events/scan', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        codeValue: activeQrCodeValue,
        scanType: 'update_diary',
        diaryEntry: 'Should fail',
      }),
    });
    assert.equal(oldScan.status, 400);

    const newQr = await http(`/production-orders/${productionOrderId}/qr`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(newQr.status, 200);
    assert.equal(newQr.json.codeValue, reissuedQrCodeValue);
  });
});
