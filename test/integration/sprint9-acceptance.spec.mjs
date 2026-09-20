import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint9_integration';
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
let adminToken = '';
let locationId = '';
let pickupAuthorizationId = '';
let remoteApprovalId = '';
let custodyEventId = '';

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

  const tenant = await tenantService.create({ code: 'TENANTPK', legalName: 'Tenant Pickup Ltda', displayName: 'Tenant Pickup', actorUserId: bootstrapActorId });
  tenantId = tenant.id;

  const branch = await branchService.create({ tenantId, code: 'PK01', legalName: 'Pickup Branch', displayName: 'Pickup Branch', actorUserId: bootstrapActorId, businessCalendarName: 'Pickup Calendar' });
  branchId = branch.id;

  const adminUser = await identityService.createUser({ tenantId, defaultBranchId: branchId, email: 'pickup-admin@tenant.test', displayName: 'Pickup Admin', password: 'SuperSecret123', actorUserId: bootstrapActorId });

  const role = await authorizationService.createRole({ tenantId, code: 'PICKUP_ADMIN', displayName: 'Pickup Admin', actorUserId: adminUser.id });
  for (const permissionCode of ['pickup.read', 'pickup.write', 'custody.read', 'custody.write']) {
    const permission = await authorizationService.createPermission({ tenantId, code: permissionCode, displayName: permissionCode, actorUserId: adminUser.id });
    await authorizationService.assignPermissionToRole({ tenantId, roleId: role.id, permissionId: permission.id, actorUserId: adminUser.id });
  }
  await authorizationService.assignRole({ tenantId, userId: adminUser.id, roleId: role.id, assignedBranchId: branchId, actorUserId: adminUser.id });
  await authorizationService.assignBranchScope({ tenantId, userId: adminUser.id, branchId, scopeType: 'admin', actorUserId: adminUser.id });

  const customer = await customerService.create({ tenantId, branchId, fullName: 'Sprint 9 Customer', mobilePhone: '(11) 98888-1111', actorUserId: bootstrapActorId });
  customerId = customer.id;

  const created = await serviceOrderService.create({
    tenantId,
    branchId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: '2026-09-20T10:00:00.000Z',
    items: [{ itemType: 'dress', description: 'Pickup Dress', quantity: 1, unitPrice: 120 }],
  });
  serviceOrderId = created.serviceOrder.id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email: 'pickup-admin@tenant.test', password: 'SuperSecret123' }),
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

describe('Sprint 9 acceptance', () => {
  it('supports pickup authorization, remote approval, location visibility, pickup evidence, and custody traceability', async () => {
    const createdLocation = await http('/storage-locations', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ branchId, rowCode: 'A', shelfCode: '03' }),
    });
    assert.equal(createdLocation.status, 201);
    locationId = createdLocation.json.id;
    assert.equal(createdLocation.json.displayLabel, 'Row A / Shelf 03');

    const assignment = await http(`/service-orders/${serviceOrderId}/location-assignments`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ storageLocationId: locationId, assignmentReason: 'Ready for concierge retrieval', bagLabel: 'Bag-01', bagNotes: 'Support-only container', bagInUse: true }),
    });
    assert.equal(assignment.status, 201);
    assert.equal(assignment.json.location.displayLabel, 'Row A / Shelf 03');
    assert.equal(assignment.json.bagSupportContext.bagLabel, 'Bag-01');

    const currentLocation = await http(`/service-orders/${serviceOrderId}/location`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(currentLocation.status, 200);
    assert.equal(currentLocation.json.location.displayLabel, 'Row A / Shelf 03');

    const createdAuthorization = await http(`/service-orders/${serviceOrderId}/pickup-authorizations`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ authorizedPersonName: 'Courier One', authorizationPath: 'courier', validUntil: '2099-09-20T18:00:00.000Z', requireRemoteApproval: true }),
    });
    assert.equal(createdAuthorization.status, 201);
    pickupAuthorizationId = createdAuthorization.json.id;
    assert.equal(createdAuthorization.json.status, 'pending');

    const remoteApprovalRequest = await http(`/pickup-authorizations/${pickupAuthorizationId}/remote-approval/request`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ channel: 'whatsapp' }),
    });
    assert.equal(remoteApprovalRequest.status, 201);
    remoteApprovalId = remoteApprovalRequest.json.approval.id;
    assert.equal(remoteApprovalRequest.json.approval.decision, 'pending');

    const remoteApprovalDecision = await http(`/pickup-authorizations/${pickupAuthorizationId}/remote-approval/decision`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ approvalId: remoteApprovalId, decision: 'approved', channel: 'whatsapp', decisionNotes: 'Customer approved courier release' }),
    });
    assert.equal(remoteApprovalDecision.status, 201);
    assert.equal(remoteApprovalDecision.json.authorization.status, 'approved');

    const token = await http(`/pickup-authorizations/${pickupAuthorizationId}/tokens`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ value: 'TOKEN-9001', expiresAt: '2099-09-20T20:00:00.000Z' }),
    });
    assert.equal(token.status, 201);
    assert.equal(token.json.tokenValue, 'TOKEN-9001');

    const completed = await http(`/pickup-authorizations/${pickupAuthorizationId}/complete`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ authorizationMethod: 'token', credentialValue: 'TOKEN-9001', notes: 'Released after identity confirmation', cameraSnapshots: [{ sourceLabel: 'camera-1', referenceUri: 'snapshot://pickup-9001' }], cctvReferences: [{ sourceLabel: 'cctv-1', referenceUri: 'cctv://pickup-9001' }] }),
    });
    assert.equal(completed.status, 201);
    assert.equal(completed.json.authorization.status, 'completed');
    custodyEventId = completed.json.custodyEvent.id;

    const pickupDetails = await http(`/pickup-authorizations/${pickupAuthorizationId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(pickupDetails.status, 200);
    assert.equal(pickupDetails.json.authorization.status, 'completed');
    assert.equal(pickupDetails.json.tokens[0].status, 'used');
    assert.equal(pickupDetails.json.currentLocation.location.displayLabel, 'Row A / Shelf 03');

    const locationHistory = await http(`/service-orders/${serviceOrderId}/location-history`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(locationHistory.status, 200);
    assert.equal(locationHistory.json.length, 1);
    assert.equal(locationHistory.json[0].bagSupportContext.bagLabel, 'Bag-01');

    const custodyEvents = await http(`/custody-events?serviceOrderId=${serviceOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(custodyEvents.status, 200);
    assert.equal(custodyEvents.json.length, 2);

    const custodyEventDetails = await http(`/custody-events/${custodyEventId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(custodyEventDetails.status, 200);
    assert.equal(custodyEventDetails.json.custodyEvent.eventStage, 'pickup');
    assert.equal(custodyEventDetails.json.cameraSnapshots.length, 1);
    assert.equal(custodyEventDetails.json.cctvReferences.length, 1);
  });
});
