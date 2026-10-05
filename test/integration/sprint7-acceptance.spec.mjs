import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint7_integration';
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
let serviceOrderItemId1 = '';
let serviceOrderItemId2 = '';
let promisedDeliveryDate = '';
let expectedReceiptDate = '';
let adminToken = '';
let paymentId = '';
let financialExceptionId = '';

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

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
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
    code: 'TENANTFIN',
    legalName: 'Tenant Finance Ltda',
    displayName: 'Tenant Finance',
    actorUserId: bootstrapActorId,
  });
  tenantId = tenant.id;

  const branch = await branchService.create({
    tenantId,
    code: 'FIN1',
    legalName: 'Finance Branch',
    displayName: 'Finance Branch',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Finance Calendar',
  });
  branchId = branch.id;

  const adminUser = await identityService.createUser({
    tenantId,
    defaultBranchId: branchId,
    email: 'finance-admin@tenant.test',
    displayName: 'Finance Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const role = await authorizationService.createRole({
    tenantId,
    code: 'FINANCE_ADMIN',
    displayName: 'Finance Admin',
    actorUserId: adminUser.id,
  });

  for (const permissionCode of ['finance.read', 'finance.write', 'tenants.read', 'tenants.write']) {
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
    fullName: 'Sprint 7 Customer',
    mobilePhone: '(11) 96666-1111',
    actorUserId: bootstrapActorId,
  });
  customerId = customer.id;

  const created = await serviceOrderService.create({
    tenantId,
    branchId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: '2026-09-20T10:00:00.000Z',
    paymentTermsDays: 5,
    items: [
      { itemType: 'shirt', description: 'Executive Shirt', quantity: 1, unitPrice: 25 },
      { itemType: 'pants', description: 'Formal Pants', quantity: 1, unitPrice: 35 },
    ],
  });
  serviceOrderId = created.serviceOrder.id;
  serviceOrderItemId1 = created.items[0].id;
  serviceOrderItemId2 = created.items[1].id;
  promisedDeliveryDate = created.serviceOrder.promisedDeliveryDate;
  expectedReceiptDate = addDays(promisedDeliveryDate, 5);

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'finance-admin@tenant.test', password: 'SuperSecret123' }),
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

describe('Sprint 7 acceptance', () => {
  it('supports tenant delivery blocking, payments, allocations, summaries, cash flow, and financial exceptions', async () => {
    const updatedTenant = await http(`/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ blockDeliveryWithOutstandingBalance: true }),
    });
    assert.equal(updatedTenant.status, 200);
    assert.equal(updatedTenant.json.blockDeliveryWithOutstandingBalance, true);

    const createdPayment = await http('/payments', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        serviceOrderId,
        paymentMethod: 'pix',
        paymentProvider: 'pagbank',
        paymentAmount: 25,
        allocations: [{ serviceOrderItemId: serviceOrderItemId1, allocatedAmount: 15 }],
      }),
    });
    assert.equal(createdPayment.status, 201);
    paymentId = createdPayment.json.payment.id;
    assert.equal(createdPayment.json.payment.paymentAmount, '25.00');
    assert.equal(createdPayment.json.paymentStatus, 'partial');
    assert.equal(createdPayment.json.outstandingBalance, '35.00');

    const listedPayments = await http(`/payments?serviceOrderId=${serviceOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(listedPayments.status, 200);
    assert.equal(listedPayments.json.length, 1);

    const paymentDetails = await http(`/payments/${paymentId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(paymentDetails.status, 200);
    assert.equal(paymentDetails.json.allocations.length, 1);
    assert.equal(paymentDetails.json.unallocatedAmount, '10.00');

    const addedAllocations = await http(`/payments/${paymentId}/allocations`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ allocations: [{ serviceOrderItemId: serviceOrderItemId2, allocatedAmount: 10 }] }),
    });
    assert.equal(addedAllocations.status, 201);
    assert.equal(addedAllocations.json.allocations.length, 2);

    const summary = await http(`/service-orders/${serviceOrderId}/financial-summary`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(summary.status, 200);
    assert.equal(summary.json.orderTotal, '60.00');
    assert.equal(summary.json.amountPaid, '25.00');
    assert.equal(summary.json.outstandingBalance, '35.00');
    assert.equal(summary.json.paymentStatus, 'partial');
    assert.equal(summary.json.deliveryBlocked, true);
    assert.equal(summary.json.items.length, 2);

    const partialPayments = await http(`/service-orders/${serviceOrderId}/partial-payments`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(partialPayments.status, 200);
    assert.equal(partialPayments.json.length, 2);

    const expectedCashflow = await http(`/cashflow/expected?branchId=${branchId}&fromDate=2026-09-20&toDate=2026-10-31`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(expectedCashflow.status, 200);
    assert.equal(expectedCashflow.json.length, 1);
    assert.equal(expectedCashflow.json[0].expectedReceiptDate, expectedReceiptDate);
    assert.equal(expectedCashflow.json[0].outstandingBalance, '35.00');

    const actualCashflow = await http('/cashflow/actual?paymentMethod=pix', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(actualCashflow.status, 200);
    assert.equal(actualCashflow.json.length, 1);
    assert.equal(actualCashflow.json[0].paymentId, paymentId);
    assert.equal(actualCashflow.json[0].paymentAmount, '25.00');

    const createdException = await http('/financial-exceptions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        serviceOrderId,
        paymentRecordId: paymentId,
        exceptionType: 'allocation_correction',
        reason: 'Customer requested allocation correction',
        amountImpact: 10,
      }),
    });
    assert.equal(createdException.status, 201);
    financialExceptionId = createdException.json.id;
    assert.equal(createdException.json.status, 'open');

    const exceptionDetails = await http(`/financial-exceptions/${financialExceptionId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(exceptionDetails.status, 200);
    assert.equal(exceptionDetails.json.financialException.id, financialExceptionId);
    assert.equal(exceptionDetails.json.payment.id, paymentId);

    const resolvedException = await http(`/financial-exceptions/${financialExceptionId}/resolve`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ resolutionNotes: 'Manager approved' }),
    });
    assert.equal(resolvedException.status, 201);
    assert.equal(resolvedException.json.status, 'resolved');
  });
});
