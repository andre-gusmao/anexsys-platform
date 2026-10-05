import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint2_integration';
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
let branchTwoCustomerId = '';
let customerId = '';
let adminToken = '';
let bodyPartIds = {};
let unitIds = {};

async function adminClient(database = 'postgres') {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database,
  });
  await client.connect();
  return client;
}

async function http(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  return {
    status: response.status,
    json: await response.json(),
  };
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
  await bootstrapClient.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [DB_NAME],
  );
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
  const bootstrapActorId = randomUUID();

  const tenant = await tenantService.create({
    code: 'TENANTCRM',
    legalName: 'Tenant CRM Ltda',
    displayName: 'Tenant CRM',
    actorUserId: bootstrapActorId,
  });
  tenantId = tenant.id;

  const branchOne = await branchService.create({
    tenantId,
    code: 'CRM1',
    legalName: 'CRM Branch 1',
    displayName: 'CRM Branch 1',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'CRM Main',
  });
  branchOneId = branchOne.id;

  const branchTwo = await branchService.create({
    tenantId,
    code: 'CRM2',
    legalName: 'CRM Branch 2',
    displayName: 'CRM Branch 2',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'CRM Secondary',
  });
  branchTwoId = branchTwo.id;

  const adminUser = await identityService.createUser({
    tenantId,
    defaultBranchId: branchOneId,
    email: 'crm-admin@tenant.test',
    displayName: 'CRM Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const role = await authorizationService.createRole({
    tenantId,
    code: 'CRM_ADMIN',
    displayName: 'CRM Admin',
    actorUserId: adminUser.id,
  });

  for (const permissionCode of ['customers.read', 'customers.write', 'measurements.read', 'measurements.write']) {
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

  const branchTwoCustomer = await customerService.create({
    tenantId,
    fullName: 'Out Of Scope Customer',
    mobilePhone: '(11) 97777-6655',
    postalCode: '01310-100',
    street: 'Avenida Paulista',
    number: '900',
    complement: 'Conjunto 91',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    actorUserId: bootstrapActorId,
  });
  branchTwoCustomerId = branchTwoCustomer.id;

  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'crm-admin@tenant.test', password: 'SuperSecret123' }),
  });
  adminToken = login.json.accessToken;

  const catalog = await http('/measurement-catalog', {
    method: 'GET',
    headers: {
      authorization: 'Bearer ' + adminToken,
      'x-tenant-id': tenantId,
    },
  });
  bodyPartIds = Object.fromEntries(catalog.json.bodyParts.map((item) => [item.code, item.id]));
  unitIds = Object.fromEntries(catalog.json.units.map((item) => [item.code, item.id]));
});

after(async () => {
  if (app) {
    await app.close();
  }

  const cleanupClient = await adminClient();
  await cleanupClient.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [DB_NAME],
  );
  await cleanupClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  await cleanupClient.end();
});

describe('Sprint 2 acceptance', () => {
  it('creates customers and returns the customer profile with history', async () => {
    const created = await http('/customers', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        fullName: 'Maria da Silva',
        mobilePhone: '(11) 99888-7766',
        cpf: '529.982.247-25',
        postalCode: '12345-678',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Casa 2',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        email: 'maria@cliente.test',
        birthDate: '1992-03-10',
        observations: 'VIP customer',
      }),
    });

    assert.equal(created.status, 201);
    assert.equal(created.json.legalName, 'Maria da Silva');
    assert.equal(created.json.phone, '11998887766');
    assert.equal(created.json.branchId, null);
    assert.equal(created.json.postalCode, '12345678');
    assert.equal(created.json.street, 'Rua das Flores');
    assert.equal(created.json.number, '123');
    assert.equal(created.json.complement, 'Casa 2');
    assert.equal(created.json.district, 'Centro');
    assert.equal(created.json.city, 'São Paulo');
    assert.equal(created.json.state, 'SP');
    assert.equal(created.json.country, 'Brasil');
    customerId = created.json.id;

    const profile = await http(`/customers/${customerId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });

    assert.equal(profile.status, 200);
    assert.equal(profile.json.customer.id, customerId);
    assert.equal(profile.json.contacts.length, 1);
    assert.equal(profile.json.interactions[0].interactionType, 'profile_created');
  });

  it('searches tenant-wide customers regardless of branch scope', async () => {
    const response = await http('/customers?q=maria', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.json.some((customer) => customer.id === customerId), true);
    const sharedResponse = await http('/customers?q=scope', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(sharedResponse.status, 200);
    assert.equal(sharedResponse.json.some((customer) => customer.id === branchTwoCustomerId), true);
  });

  it('updates, deactivates, and reactivates customers', async () => {
    const updated = await http(`/customers/${customerId}`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        observations: 'Updated note',
        street: 'Rua Atualizada',
        number: '456',
        complement: 'Casa 4',
        district: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
      }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.json.observations, 'Updated note');
    assert.equal(updated.json.street, 'Rua Atualizada');

    const deactivated = await http(`/customers/${customerId}`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    assert.equal(deactivated.status, 200);
    assert.equal(deactivated.json.status, 'inactive');

    const reactivated = await http(`/customers/${customerId}`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    assert.equal(reactivated.status, 200);
    assert.equal(reactivated.json.status, 'active');
  });

  it('versions customer measurements as standardized measurement sets and returns history', async () => {
    const first = await http(`/customers/${customerId}/measurements`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        measurementDate: '2026-09-22',
        notes: 'Initial fitting',
        items: [
          { bodyPartId: bodyPartIds.CINTURA, unitId: unitIds.CM, value: 86 },
          { bodyPartId: bodyPartIds.BUSTO, unitId: unitIds.CM, value: 92 },
        ],
      }),
    });
    assert.equal(first.status, 201);
    assert.equal(first.json.versionNo, 1);
    assert.equal(first.json.items.length, 2);

    const second = await http(`/customers/${customerId}/measurements`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        measurementDate: '2026-09-23',
        notes: 'Recheck',
        items: [{ bodyPartId: bodyPartIds.CINTURA, value: 87 }],
      }),
    });
    assert.equal(second.status, 201);
    assert.equal(second.json.versionNo, 2);
    assert.equal(second.json.items[0].measurementUnitCode, 'CM');

    const history = await http(`/customers/${customerId}/measurements`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(history.status, 200);
    assert.equal(history.json.measurementSets.length, 2);
    assert.equal(history.json.measurementSets[0].versionNo, 2);
    assert.equal(history.json.latestByLabel.find((item) => item.measurementLabel === 'cintura').versionNo, 2);
  });

  it('lists and extends measurement master data', async () => {
    const listedBodyParts = await http('/measurement-body-parts', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(listedBodyParts.status, 200);
    assert.equal(listedBodyParts.json.some((item) => item.code === 'BUSTO'), true);

    const createdBodyPart = await http('/measurement-body-parts', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ displayName: 'Tórax', sortOrder: 99 }),
    });
    assert.equal(createdBodyPart.status, 201);
    assert.equal(createdBodyPart.json.code, 'TORAX');

    const listedUnits = await http('/measurement-units', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(listedUnits.status, 200);
    assert.equal(listedUnits.json.some((item) => item.code === 'CM'), true);

    const createdUnit = await http('/measurement-units', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ code: 'IN', displayName: 'Inches' }),
    });
    assert.equal(createdUnit.status, 201);
    assert.equal(createdUnit.json.code, 'IN');

    const catalog = await http('/measurement-catalog', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });
    assert.equal(catalog.status, 200);
    assert.equal(catalog.json.bodyParts.some((item) => item.code === 'TORAX'), true);
    assert.equal(catalog.json.units.some((item) => item.code === 'IN'), true);
  });

  it('rejects duplicate customer documents inside the same tenant', async () => {
    const response = await http('/customers', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        fullName: 'Blocked Branch Customer',
        mobilePhone: '(11) 94444-3322',
        cpf: '529.982.247-25',
        postalCode: '01001-000',
        street: 'Praça da Sé',
        number: '1',
        complement: 'Loja 1',
        district: 'Sé',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
      }),
    });

    assert.equal(response.status, 400);
  });

  it('enforces validation on customer and measurement payloads', async () => {
    const invalidCustomer = await http('/customers', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ fullName: 'Invalid Customer', mobilePhone: '(11) 95555-1111' }),
    });
    assert.equal(invalidCustomer.status, 400);
    assert.equal(
      invalidCustomer.json.message,
      'Customer could not be saved. Some registration fields are missing or invalid. Review name, contact, address, and document information, then try again.',
    );

    const invalidMeasurement = await http(`/customers/${customerId}/measurements`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({}),
    });
    assert.equal(invalidMeasurement.status, 400);
  });

  it('returns tenant-wide customer profiles across branches', async () => {
    const response = await http(`/customers/${branchTwoCustomerId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantId,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.json.customer.id, branchTwoCustomerId);
  });
});
