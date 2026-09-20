import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint10_integration';
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
let adminUserId = '';
let portalUserId = '';
let adminToken = '';
let portalToken = '';
let approvalId = '';
let approvalLinkToken = '';
let pickupAuthorizationId = '';
let checkInId = '';
let locationId = '';

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

  const tenant = await tenantService.create({ code: 'TENANTCX', legalName: 'Tenant CX Ltda', displayName: 'Tenant CX', actorUserId: bootstrapActorId });
  tenantId = tenant.id;

  const branch = await branchService.create({ tenantId, code: 'CX01', legalName: 'Customer Experience Branch', displayName: 'Customer Experience', businessCalendarName: 'CX Calendar', actorUserId: bootstrapActorId });
  branchId = branch.id;

  const adminUser = await identityService.createUser({ tenantId, defaultBranchId: branchId, email: 'admin@tenantcx.test', displayName: 'CX Admin', password: 'SuperSecret123', actorUserId: bootstrapActorId });
  adminUserId = adminUser.id;
  const portalUser = await identityService.createUser({ tenantId, defaultBranchId: branchId, email: 'customer@tenantcx.test', displayName: 'Portal Customer', password: 'CustomerSecret123', actorUserId: bootstrapActorId });
  portalUserId = portalUser.id;

  const adminRole = await authorizationService.createRole({ tenantId, code: 'CX_ADMIN', displayName: 'CX Admin', actorUserId: adminUser.id });
  const portalRole = await authorizationService.createRole({ tenantId, code: 'CX_PORTAL', displayName: 'CX Portal', actorUserId: adminUser.id });

  for (const permissionCode of ['pickup.read', 'pickup.write', 'custody.read', 'custody.write', 'customer-portal.manage', 'customer-portal.read', 'customer-portal.write', 'smart-concierge.read', 'smart-concierge.write']) {
    const permission = await authorizationService.createPermission({ tenantId, code: permissionCode, displayName: permissionCode, actorUserId: adminUser.id });
    await authorizationService.assignPermissionToRole({ tenantId, roleId: adminRole.id, permissionId: permission.id, actorUserId: adminUser.id });
    if (permissionCode.startsWith('customer-portal.')) {
      await authorizationService.assignPermissionToRole({ tenantId, roleId: portalRole.id, permissionId: permission.id, actorUserId: adminUser.id });
    }
  }

  await authorizationService.assignRole({ tenantId, userId: adminUser.id, roleId: adminRole.id, assignedBranchId: branchId, actorUserId: adminUser.id });
  await authorizationService.assignRole({ tenantId, userId: portalUser.id, roleId: portalRole.id, assignedBranchId: branchId, actorUserId: adminUser.id });
  await authorizationService.assignBranchScope({ tenantId, userId: adminUser.id, branchId, scopeType: 'admin', actorUserId: adminUser.id });
  await authorizationService.assignBranchScope({ tenantId, userId: portalUser.id, branchId, scopeType: 'member', actorUserId: adminUser.id });

  const customer = await customerService.create({ tenantId, branchId, fullName: 'Portal Customer', email: 'customer@tenantcx.test', mobilePhone: '(11) 99999-0000', cpf: '12345678901', actorUserId: adminUser.id });
  customerId = customer.id;

  const created = await serviceOrderService.create({
    tenantId,
    branchId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: '2026-09-20T10:00:00.000Z',
    actualPickupDate: '2026-09-20',
    items: [{ itemType: 'dress', description: 'Sprint 10 Dress', quantity: 1, unitPrice: 150 }],
  });
  serviceOrderId = created.serviceOrder.id;

  const adminLogin = await http('/auth/login/password', { method: 'POST', body: JSON.stringify({ tenantId, email: 'admin@tenantcx.test', password: 'SuperSecret123' }) });
  adminToken = adminLogin.json.accessToken;
  const portalLogin = await http('/auth/login/password', { method: 'POST', body: JSON.stringify({ tenantId, email: 'customer@tenantcx.test', password: 'CustomerSecret123' }) });
  portalToken = portalLogin.json.accessToken;
});

after(async () => {
  if (app) await app.close();
  const cleanupClient = await adminClient();
  await cleanupClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [DB_NAME]);
  await cleanupClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  await cleanupClient.end();
});

describe('Sprint 10 acceptance', () => {
  it('supports reception queue, customer portal, approvals, pickup authorization, and safe status visibility', async () => {
    const linkedProfile = await http('/customer-portal/profiles', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ customerId, userId: portalUserId, customerCode: 'CUST-001', vipFlag: true, preferredChannel: 'whatsapp' }),
    });
    assert.equal(linkedProfile.status, 201);
    assert.equal(linkedProfile.json.customerCode, 'CUST-001');

    const createdLocation = await http('/storage-locations', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ branchId, rowCode: 'A', shelfCode: '03' }),
    });
    assert.equal(createdLocation.status, 201);
    locationId = createdLocation.json.id;

    const assignment = await http(`/service-orders/${serviceOrderId}/location-assignments`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ storageLocationId: locationId, assignmentReason: 'Ready for concierge retrieval', bagLabel: 'Bag-10', bagNotes: 'Support-only container', bagInUse: true }),
    });
    assert.equal(assignment.status, 201);

    const portalProfile = await http('/customer-portal/me', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(portalProfile.status, 200);
    assert.equal(portalProfile.json.profile.customerCode, 'CUST-001');

    const approvalRequest = await http('/customer-portal/approvals/requests', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ serviceOrderId, channel: 'portal', title: 'Approve change', messageSummary: 'Please approve the requested service adjustment.' }),
    });
    assert.equal(approvalRequest.status, 201);
    approvalId = approvalRequest.json.id;
    approvalLinkToken = approvalRequest.json.approvalLinkToken;

    const approvalList = await http('/customer-portal/approvals', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(approvalList.status, 200);
    assert.equal(approvalList.json.length, 1);
    assert.equal(approvalList.json[0].decision, 'pending');

    const approvalDecision = await http(`/customer-portal/approval-links/${approvalLinkToken}/approve`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ decisionNotes: 'Approved in portal' }),
    });
    assert.equal(approvalDecision.status, 201);
    assert.equal(approvalDecision.json.decision, 'approved');

    const portalPickup = await http(`/customer-portal/service-orders/${serviceOrderId}/pickup-authorizations`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ authorizedPersonName: 'Third Party Courier', authorizationPath: 'third_party', validUntil: '2099-09-20T18:00:00.000Z', credentialType: 'temporary_code', expiresAt: '2099-09-20T20:00:00.000Z' }),
    });
    assert.equal(portalPickup.status, 201);
    pickupAuthorizationId = portalPickup.json.authorization.id;
    assert.equal(portalPickup.json.credential.codeValue.length > 0, true);

    const pickupList = await http('/customer-portal/pickup-authorizations', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(pickupList.status, 200);
    assert.equal(pickupList.json.length, 1);

    const revokedPickup = await http(`/customer-portal/pickup-authorizations/${pickupAuthorizationId}/revoke`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(revokedPickup.status, 201);
    assert.equal(revokedPickup.json.status, 'cancelled');

    const warrantyRequest = await http('/customer-portal/warranty-requests', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ serviceOrderId, adjustmentReason: 'Customer requests warranty adjustment.' }),
    });
    assert.equal(warrantyRequest.status, 201);

    const warrantyList = await http('/customer-portal/warranty-requests', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(warrantyList.status, 200);
    assert.equal(warrantyList.json.adjustments.length, 1);

    const orderDetails = await http(`/customer-portal/orders/${serviceOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(orderDetails.status, 200);
    assert.equal(orderDetails.json.currentStatus.externalName, 'Warranty In Analysis');
    assert.equal('totalValue' in orderDetails.json, false);
    assert.equal(orderDetails.json.storageLocation.displayLabel, 'Row A / Shelf 03');

    const statusMappings = await http('/customer-portal/status-mappings', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + portalToken, 'x-tenant-id': tenantId },
    });
    assert.equal(statusMappings.status, 200);
    assert.equal(statusMappings.json.some((item) => item.internalName === 'quality_rejected' && item.externalName === 'In Final Adjustment'), true);

    const createdCheckIn = await http('/smart-concierge/check-ins', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ branchId, serviceOrderId, identificationMethod: 'customer_code', identificationValue: 'CUST-001', notes: 'Customer arrived at reception' }),
    });
    assert.equal(createdCheckIn.status, 201);
    checkInId = createdCheckIn.json.checkIn.id;
    assert.equal(createdCheckIn.json.portal.vipFlag, true);

    const queue = await http('/smart-concierge/queue', {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(queue.status, 200);
    assert.equal(queue.json.length, 1);
    assert.equal(queue.json[0].financialPendingIssues, true);

    const inService = await http(`/smart-concierge/check-ins/${checkInId}/handoff`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ status: 'in_service', notes: 'Attendant started service' }),
    });
    assert.equal(inService.status, 201);
    assert.equal(inService.json.checkIn.status, 'in_service');

    const completed = await http(`/smart-concierge/check-ins/${checkInId}/handoff`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ status: 'completed', notes: 'Service completed at reception' }),
    });
    assert.equal(completed.status, 201);
    assert.equal(completed.json.checkIn.status, 'completed');

    const notification = await http('/smart-concierge/notifications', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ branchId, customerId, serviceOrderId, channel: 'whatsapp', messageSummary: 'Your order is ready for the next step.' }),
    });
    assert.equal(notification.status, 201);

    const checkInDetails = await http(`/smart-concierge/check-ins/${checkInId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(checkInDetails.status, 200);
    assert.equal(checkInDetails.json.storageLocation.displayLabel, 'Row A / Shelf 03');
    assert.equal(checkInDetails.json.portal.customerCode, 'CUST-001');
  });
});
