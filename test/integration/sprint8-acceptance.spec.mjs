import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint8_integration';
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
let serviceOrderItemId = '';
let adminToken = '';
let fiscalDocumentId = '';

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
    code: 'TENANTFSC',
    legalName: 'Tenant Fiscal Ltda',
    displayName: 'Tenant Fiscal',
    actorUserId: bootstrapActorId,
  });
  tenantId = tenant.id;

  const branch = await branchService.create({
    tenantId,
    code: 'FSC1',
    legalName: 'Fiscal Branch',
    displayName: 'Fiscal Branch',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Fiscal Calendar',
  });
  branchId = branch.id;

  const adminUser = await identityService.createUser({
    tenantId,
    defaultBranchId: branchId,
    email: 'fiscal-admin@tenant.test',
    displayName: 'Fiscal Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const role = await authorizationService.createRole({
    tenantId,
    code: 'FISCAL_ADMIN',
    displayName: 'Fiscal Admin',
    actorUserId: adminUser.id,
  });

  for (const permissionCode of ['finance.read', 'finance.write', 'fiscal.read', 'fiscal.write']) {
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
    fullName: 'Sprint 8 Customer',
    mobilePhone: '(11) 97777-1111',
    actorUserId: bootstrapActorId,
  });
  customerId = customer.id;

  const created = await serviceOrderService.create({
    tenantId,
    branchId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: '2026-09-20T10:00:00.000Z',
    items: [{ itemType: 'shirt', description: 'Fiscal Shirt', quantity: 1, unitPrice: 80 }],
  });
  serviceOrderId = created.serviceOrder.id;
  serviceOrderItemId = created.items[0].id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'fiscal-admin@tenant.test', password: 'SuperSecret123' }),
  });
  adminToken = login.json.accessToken;
});

after(async () => {
  if (app) await app.close();
  const cleanupClient = await adminClient();
  await cleanupClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [DB_NAME]);
  await cleanupClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  await cleanupClient.end();
});

describe('Sprint 8 acceptance', () => {
  it('supports fiscal document lifecycle, status sync, events, timeline, and cancellation records', async () => {
    const createdFiscalDocument = await http('/fiscal-documents', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        serviceOrderId,
        serviceOrderItemId,
        documentType: 'nfse',
        documentNo: 'NFSE-2001',
        grossAmount: 80,
      }),
    });
    assert.equal(createdFiscalDocument.status, 201);
    fiscalDocumentId = createdFiscalDocument.json.id;
    assert.equal(createdFiscalDocument.json.status, 'draft');

    const listed = await http(`/fiscal-documents?serviceOrderId=${serviceOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(listed.status, 200);
    assert.equal(listed.json.length, 1);
    assert.equal(listed.json[0].documentNo, 'NFSE-2001');

    const createdDetails = await http(`/fiscal-documents/${fiscalDocumentId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(createdDetails.status, 200);
    assert.equal(createdDetails.json.fiscalStatus, 'draft');
    assert.equal(createdDetails.json.fiscalEvents.length, 1);

    const issued = await http(`/fiscal-documents/${fiscalDocumentId}/issue`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        issuedAt: '2026-09-20T12:00:00.000Z',
        providerStatus: 'authorized',
        providerReferenceNo: 'provider-100',
      }),
    });
    assert.equal(issued.status, 201);
    assert.equal(issued.json.status, 'issued');

    const synced = await http(`/fiscal-documents/${fiscalDocumentId}/sync-status`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        status: 'issued',
        providerStatus: 'synced',
        providerReferenceNo: 'provider-100',
        notes: 'Provider confirms issued state',
      }),
    });
    assert.equal(synced.status, 201);
    assert.equal(synced.json.status, 'issued');

    const cancelled = await http(`/fiscal-documents/${fiscalDocumentId}/cancel`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        reason: 'Customer requested cancellation',
        providerStatus: 'cancelled',
      }),
    });
    assert.equal(cancelled.status, 201);
    assert.equal(cancelled.json.status, 'cancelled');

    const finalDetails = await http(`/fiscal-documents/${fiscalDocumentId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(finalDetails.status, 200);
    assert.equal(finalDetails.json.fiscalStatus, 'cancelled');
    assert.equal(finalDetails.json.fiscalEvents.length, 4);
    assert.equal(finalDetails.json.timeline.at(-1).action, 'fiscal_document.cancelled');
    assert.equal(finalDetails.json.cancellationRecords.length, 1);
    assert.equal(finalDetails.json.cancellationRecords[0].metadata.reason, 'Customer requested cancellation');
  });
});
