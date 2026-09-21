import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint6_integration';
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
let productionOrderId = '';
let originalResourceId = '';
let correctiveResourceId = '';
let correctiveResourceId2 = '';
let adminToken = '';
let customerRejectionId = '';
let reworkCaseId = '';
let warrantyAdjustmentId = '';
let warrantyExecutionId = '';

function utcDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

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
    code: 'TENANTQRW',
    legalName: 'Tenant QRW Ltda',
    displayName: 'Tenant QRW',
    actorUserId: bootstrapActorId,
  });
  tenantId = tenant.id;

  const branch = await branchService.create({
    tenantId,
    code: 'QW1',
    legalName: 'QW Branch',
    displayName: 'QW Branch',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'QW Calendar',
  });
  branchId = branch.id;

  const adminUser = await identityService.createUser({
    tenantId,
    defaultBranchId: branchId,
    email: 'quality-admin@tenant.test',
    displayName: 'Quality Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const role = await authorizationService.createRole({
    tenantId,
    code: 'QUALITY_ADMIN',
    displayName: 'Quality Admin',
    actorUserId: adminUser.id,
  });

  for (const permissionCode of [
    'customers.read',
    'customers.write',
    'tenants.read',
    'tenants.write',
    'service_orders.read',
    'service_orders.write',
    'production_orders.read',
    'production_orders.write',
    'operational_resources.read',
    'operational_resources.write',
    'quality.read',
    'quality.write',
    'rework.read',
    'rework.write',
    'warranty.read',
    'warranty.write',
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
    fullName: 'Sprint 6 Customer',
    mobilePhone: '(11) 95555-1111',
    actorUserId: bootstrapActorId,
  });
  customerId = customer.id;

  const created = await serviceOrderService.create({
    tenantId,
    branchId,
    customerId,
    actorUserId: adminUser.id,
    deliveryCommitmentSourceAt: new Date().toISOString(),
    items: [{ itemType: 'shirt', description: 'Blue Shirt', quantity: 1, unitPrice: 50 }],
  });
  serviceOrderId = created.serviceOrder.id;
  serviceOrderItemId = created.items[0].id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'quality-admin@tenant.test', password: 'SuperSecret123' }),
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

describe('Sprint 6 acceptance', () => {
  it('supports quality creation, approval, and production-order quality visibility', async () => {
    const originalResource = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchId,
        resourceType: 'employee',
        displayName: 'Original Operator',
        skills: ['sewing'],
      }),
    });
    assert.equal(originalResource.status, 201);
    originalResourceId = originalResource.json.id;

    const correctiveResource = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchId,
        resourceType: 'employee',
        displayName: 'Corrective Operator',
        skills: ['finishing'],
      }),
    });
    assert.equal(correctiveResource.status, 201);
    correctiveResourceId = correctiveResource.json.id;

    const correctiveResource2 = await http('/operational-resources', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        homeBranchId: branchId,
        resourceType: 'employee',
        displayName: 'Warranty Operator',
        skills: ['repair'],
      }),
    });
    assert.equal(correctiveResource2.status, 201);
    correctiveResourceId2 = correctiveResource2.json.id;

    const generated = await http(`/service-orders/${serviceOrderId}/production-order/generate`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(generated.status, 201);
    productionOrderId = generated.json.productionOrder.id;

    const started = await http(`/production-orders/${productionOrderId}/start`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        operationalResourceId: originalResourceId,
        diaryEntry: 'Start original execution',
      }),
    });
    assert.equal(started.status, 201);
    assert.equal(started.json.status, 'in_progress');

    const createdQuality = await http('/quality-records', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        productionOrderId,
        serviceOrderItemId,
        inspectionType: 'final',
        notes: 'Ready for release',
      }),
    });
    assert.equal(createdQuality.status, 201);

    const listed = await http(`/production-orders/${productionOrderId}/quality`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(listed.status, 200);
    assert.equal(listed.json.length, 1);

    const approved = await http(`/quality-records/${createdQuality.json.id}/approve`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ notes: 'Approved by QA' }),
    });
    assert.equal(approved.status, 201);
    assert.equal(approved.json.releaseDecision, 'approved');

    const qualityDetails = await http(`/quality-records/${createdQuality.json.id}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(qualityDetails.status, 200);
    assert.equal(qualityDetails.json.qualityStatus, 'approved');
    assert.equal(qualityDetails.json.timeline.length >= 2, true);
  });

  it('supports customer rejection, quality-driven rework, reassignment, attribution, and closure', async () => {
    const rejection = await http('/customer-rejections', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        serviceOrderId,
        serviceOrderItemId,
        reportedQuantity: 1,
        rejectionReason: 'Customer reported open seam',
        severity: 'high',
        resolutionType: 'rework',
        notes: 'Registered at pickup counter',
      }),
    });
    assert.equal(rejection.status, 201);
    customerRejectionId = rejection.json.id;

    const updatedRejection = await http(`/customer-rejections/${customerRejectionId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        status: 'under_review',
        notes: 'Sent to QA review',
      }),
    });
    assert.equal(updatedRejection.status, 200);
    assert.equal(updatedRejection.json.status, 'under_review');

    const quality = await http('/quality-records', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        productionOrderId,
        serviceOrderItemId,
        inspectionType: 'customer_rejection',
        defects: [{ description: 'Open seam', category: 'stitching', severity: 'high' }],
        notes: 'Re-inspection after customer rejection',
      }),
    });
    assert.equal(quality.status, 201);

    const requested = await http(`/quality-records/${quality.json.id}/request-rework`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        reworkReason: 'Restitch seam and review finish',
        affectedServiceOrderItemIds: [serviceOrderItemId],
        correctiveOperationalResourceId: correctiveResourceId,
        assignmentNotes: 'Handle as urgent corrective task',
      }),
    });
    assert.equal(requested.status, 201);
    assert.equal(requested.json.qualityRecord.releaseDecision, 'rework_requested');
    assert.equal(requested.json.reworkCase.status, 'assigned');
    reworkCaseId = requested.json.reworkCase.id;

    const reworkDetails = await http(`/rework-cases/${reworkCaseId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(reworkDetails.status, 200);
    assert.equal(reworkDetails.json.reworkCase.productionOrderId, productionOrderId);

    const reassigned = await http(`/rework-cases/${reworkCaseId}/reassign`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        correctiveOperationalResourceId: correctiveResourceId2,
        assignmentNotes: 'Move to specialist',
      }),
    });
    assert.equal(reassigned.status, 201);
    assert.equal(reassigned.json.correctiveOperationalResourceId, correctiveResourceId2);

    const attribution = await http(`/rework-cases/${reworkCaseId}/attribution`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(attribution.status, 200);
    assert.equal(attribution.json.originalOperationalResourceId, originalResourceId);
    assert.equal(attribution.json.correctiveOperationalResourceId, correctiveResourceId2);
    assert.equal(attribution.json.qualityPenaltyOperationalResourceId, originalResourceId);
    assert.equal(attribution.json.correctiveResourceReceivesQualityPenalty, false);

    const versions = await http(`/production-orders/${productionOrderId}/versions`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(versions.status, 200);
    const reworkVersion = versions.json.find((version) => version.versionReason === 'rework');
    assert.ok(reworkVersion);
    assert.deepEqual(reworkVersion.affectedServiceOrderItemIds, [serviceOrderItemId]);

    const closed = await http(`/rework-cases/${reworkCaseId}/close`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ closureNotes: 'Corrective execution completed' }),
    });
    assert.equal(closed.status, 201);
    assert.equal(closed.json.status, 'closed');
  });

  it('supports warranty adjustment and quality-driven warranty execution workflows', async () => {
    const deliveryDate = utcDateDaysAgo(9);
    const pickupDate = utcDateDaysAgo(8);

    const configuredTenant = await http(`/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        warrantyAdjustmentPeriodDays: 10,
        warrantyExecutionPeriodDays: 14,
      }),
    });
    assert.equal(configuredTenant.status, 200);
    assert.equal(configuredTenant.json.warrantyAdjustmentPeriodDays, 10);
    assert.equal(configuredTenant.json.warrantyExecutionPeriodDays, 14);

    const updatedServiceOrder = await http(`/service-orders/${serviceOrderId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        actualDeliveryDate: deliveryDate,
        actualPickupDate: pickupDate,
      }),
    });
    assert.equal(updatedServiceOrder.status, 200);
    assert.equal(updatedServiceOrder.json.actualDeliveryDate, deliveryDate);
    assert.equal(updatedServiceOrder.json.actualPickupDate, pickupDate);

    const adjustment = await http('/warranty-adjustments', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        serviceOrderId,
        serviceOrderItemId,
        customerRejectionId,
        adjustmentReason: 'Too loose at sleeve',
      }),
    });
    assert.equal(adjustment.status, 201);
    warrantyAdjustmentId = adjustment.json.id;
    assert.equal(adjustment.json.warrantyStartDate, pickupDate);
    assert.equal(adjustment.json.warrantyStartSource, 'pickup');
    assert.equal(adjustment.json.warrantyPeriodDays, 10);

    const updatedAdjustment = await http(`/warranty-adjustments/${warrantyAdjustmentId}`, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ status: 'approved' }),
    });
    assert.equal(updatedAdjustment.status, 200);
    assert.equal(updatedAdjustment.json.status, 'approved');

    const quality = await http('/quality-records', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        productionOrderId,
        serviceOrderItemId,
        inspectionType: 'post_rework',
        defects: [{ description: 'Zipper failure', category: 'hardware', severity: 'critical' }],
        notes: 'Escalate to warranty execution',
      }),
    });
    assert.equal(quality.status, 201);

    const requested = await http(`/quality-records/${quality.json.id}/request-warranty-execution`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({
        executionReason: 'Repair failed and zipper must be replaced',
        affectedServiceOrderItemIds: [serviceOrderItemId],
        correctiveOperationalResourceId: correctiveResourceId2,
      }),
    });
    assert.equal(requested.status, 201);
    assert.equal(requested.json.qualityRecord.releaseDecision, 'warranty_execution_requested');
    assert.equal(requested.json.warrantyExecution.status, 'assigned');
    warrantyExecutionId = requested.json.warrantyExecution.id;

    const executionDetails = await http(`/warranty-executions/${warrantyExecutionId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(executionDetails.status, 200);
    assert.equal(executionDetails.json.warrantyExecution.productionOrderId, productionOrderId);
    assert.equal(executionDetails.json.warrantyExecution.warrantyStartDate, pickupDate);
    assert.equal(executionDetails.json.warrantyExecution.warrantyStartSource, 'pickup');
    assert.equal(executionDetails.json.warrantyExecution.warrantyPeriodDays, 14);

    const resolved = await http(`/warranty-executions/${warrantyExecutionId}/resolve`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
      body: JSON.stringify({ resolutionNotes: 'Zipper replaced and validated' }),
    });
    assert.equal(resolved.status, 201);
    assert.equal(resolved.json.status, 'resolved');

    const executions = await http(`/warranty-executions?productionOrderId=${productionOrderId}`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(executions.status, 200);
    assert.equal(executions.json.some((item) => item.id === warrantyExecutionId), true);

    const versions = await http(`/production-orders/${productionOrderId}/versions`, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + adminToken, 'x-tenant-id': tenantId },
    });
    assert.equal(versions.status, 200);
    const warrantyVersion = versions.json.find((version) => version.versionReason === 'warranty_execution');
    assert.ok(warrantyVersion);
    assert.deepEqual(warrantyVersion.affectedServiceOrderItemIds, [serviceOrderItemId]);
  });
});
