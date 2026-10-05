import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';
import { withCustomerAddress } from './helpers/customer-fixture.mjs';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_ciclo1_multiempresa';
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT ?? 5432);
const DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';
const JWT_SECRET = process.env.JWT_SECRET ?? 'anexsys-ciclo1-secret';

let app;
let baseUrl = '';
let tenantAId = '';
let tenantBId = '';
let branchAId = '';
let companyAId = '';
let adminAToken = '';
let adminBToken = '';
let receptionUserId = '';

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

async function bootstrapTenant(appRef, code, displayName, email) {
  const tenantService = appRef.get(require('../../dist/modules/tenant/application/tenant/tenant.service.js').TenantService);
  const branchService = appRef.get(require('../../dist/modules/branch/application/branch/branch.service.js').BranchService);
  const identityService = appRef.get(require('../../dist/modules/identity/application/identity/identity.service.js').IdentityService);
  const authorizationService = appRef.get(
    require('../../dist/modules/authorization/application/authorization/authorization.service.js').AuthorizationService,
  );
  const companyService = appRef.get(require('../../dist/modules/company/application/company/company.service.js').CompanyService);
  const actor = randomUUID();
  const tenant = await tenantService.create({
    code,
    legalName: `${displayName} LTDA`,
    displayName,
    actorUserId: actor,
  });
  const branch = await branchService.create({
    tenantId: tenant.id,
    code: 'MATRIZ',
    legalName: `${displayName} Matriz`,
    displayName: 'Matriz',
    actorUserId: actor,
  });
  const companies = await companyService.listByTenant(tenant.id);
  const admin = await identityService.createUser({
    tenantId: tenant.id,
    defaultBranchId: branch.id,
    email,
    displayName: `Admin ${displayName}`,
    password: 'SuperSecret123',
    actorUserId: actor,
  });
  const role = await authorizationService.createRole({
    tenantId: tenant.id,
    code: 'GERENTE',
    displayName: 'Gerente',
    actorUserId: admin.id,
  });
  for (const permissionCode of [
    'platform.tenants.create',
    'tenants.read',
    'tenants.write',
    'companies.read',
    'companies.write',
    'branches.read',
    'branches.write',
    'users.read',
    'users.write',
    'roles.read',
    'roles.write',
    'permissions.read',
    'customers.read',
    'customers.write',
    'communities.read',
    'communities.write',
  ]) {
    const permission = await authorizationService.createPermission({
      tenantId: tenant.id,
      code: permissionCode,
      displayName: permissionCode,
      actorUserId: admin.id,
    });
    await authorizationService.assignPermissionToRole({
      tenantId: tenant.id,
      roleId: role.id,
      permissionId: permission.id,
      actorUserId: admin.id,
    });
  }
  await authorizationService.assignRole({
    tenantId: tenant.id,
    userId: admin.id,
    roleId: role.id,
    assignedBranchId: branch.id,
    grantsAllBranches: true,
    actorUserId: admin.id,
  });
  await authorizationService.assignBranchScope({
    tenantId: tenant.id,
    userId: admin.id,
    branchId: branch.id,
    scopeType: 'admin',
    actorUserId: admin.id,
  });
  const login = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SuperSecret123' }),
  });
  return { tenant, branch, company: companies[0], token: login.json.accessToken, admin };
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

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  const atelierA = await bootstrapTenant(app, 'ATELIEA', 'Atelie A', 'admin-a@ciclo1.test');
  const atelierB = await bootstrapTenant(app, 'ATELIEB', 'Atelie B', 'admin-b@ciclo1.test');
  tenantAId = atelierA.tenant.id;
  tenantBId = atelierB.tenant.id;
  branchAId = atelierA.branch.id;
  companyAId = atelierA.company.id;
  adminAToken = atelierA.token;
  adminBToken = atelierB.token;

  const identityService = app.get(require('../../dist/modules/identity/application/identity/identity.service.js').IdentityService);
  const authorizationService = app.get(
    require('../../dist/modules/authorization/application/authorization/authorization.service.js').AuthorizationService,
  );
  const customerService = app.get(require('../../dist/modules/crm/application/customer/customer.service.js').CustomerService);

  await customerService.create({
    tenantId: tenantAId,
    fullName: 'Maria Teste A',
    mobilePhone: '(11) 90000-0001',
    ...withCustomerAddress(),
    actorUserId: atelierA.admin.id,
  });
  await customerService.create({
    tenantId: tenantBId,
    fullName: 'Maria Teste B',
    mobilePhone: '(11) 90000-0002',
    ...withCustomerAddress({ number: '2000' }),
    actorUserId: atelierB.admin.id,
  });

  const reception = await identityService.createUser({
    tenantId: tenantAId,
    email: 'recepcao-a@ciclo1.test',
    displayName: 'Recepcao A',
    password: 'SuperSecret123',
    actorUserId: atelierA.admin.id,
  });
  receptionUserId = reception.id;
  const receptionRole = await authorizationService.createRole({
    tenantId: tenantAId,
    code: 'RECEPCAO',
    displayName: 'Recepcao',
    actorUserId: atelierA.admin.id,
  });
  const customersRead = await authorizationService.createPermission({
    tenantId: tenantAId,
    code: 'customers.read.reception',
    displayName: 'customers.read.reception',
    actorUserId: atelierA.admin.id,
  });
  await authorizationService.assignPermissionToRole({
    tenantId: tenantAId,
    roleId: receptionRole.id,
    permissionId: customersRead.id,
    actorUserId: atelierA.admin.id,
  });
  await authorizationService.assignRole({
    tenantId: tenantAId,
    userId: reception.id,
    roleId: receptionRole.id,
    actorUserId: atelierA.admin.id,
  });
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

describe('Ciclo 1 multiempresa', () => {
  it('cria Empresa e Filial padrao com horario de Brasilia e corte no fechamento', async () => {
    const companies = await http('/companies', {
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
    });
    assert.equal(companies.status, 200);
    assert.equal(companies.json.length, 1);
    assert.equal(companies.json[0].isDefault, true);
    assert.equal(companyAId, companies.json[0].id);

    const hours = await http(`/branches/${branchAId}/operating-hours`, {
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
    });
    assert.equal(hours.status, 200);
    assert.equal(hours.json.timezone, 'America/Sao_Paulo');
    const monday = hours.json.days.find((day) => day.weekday === 1);
    const saturday = hours.json.days.find((day) => day.weekday === 6);
    const sunday = hours.json.days.find((day) => day.weekday === 0);
    assert.equal(monday.opensAt.slice(0, 5), '09:30');
    assert.equal(monday.closesAt.slice(0, 5), '18:00');
    assert.equal(monday.cutoffAt.slice(0, 5), '18:00');
    assert.equal(saturday.closesAt.slice(0, 5), '14:00');
    assert.equal(saturday.cutoffAt.slice(0, 5), '14:00');
    assert.equal(sunday.isOpen, false);
  });

  it('nao mostra cliente da Conta A na Conta B (teste do espelho)', async () => {
    const fromB = await http('/customers', {
      headers: { authorization: `Bearer ${adminBToken}`, 'x-tenant-id': tenantBId },
    });
    assert.equal(fromB.status, 200);
    const names = (Array.isArray(fromB.json) ? fromB.json : []).map((customer) => customer.legalName || customer.fullName);
    assert.ok(names.includes('Maria Teste B'));
    assert.ok(!names.includes('Maria Teste A'));

    const fromA = await http('/customers', {
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
    });
    const namesA = (Array.isArray(fromA.json) ? fromA.json : []).map((customer) => customer.legalName || customer.fullName);
    assert.ok(namesA.includes('Maria Teste A'));
    assert.ok(!namesA.includes('Maria Teste B'));
  });

  it('recusa comunidade nova e deixa usuario novo sem Filial', async () => {
    const frozen = await http('/communities', {
      method: 'POST',
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
      body: JSON.stringify({ code: 'NOVA', displayName: 'Nova comunidade' }),
    });
    assert.equal(frozen.status, 400);
    assert.match(String(frozen.json.message), /congeladas/i);

    const summary = await http(`/users/${receptionUserId}/access-summary`, {
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
    });
    assert.equal(summary.status, 200);
    assert.deepEqual(summary.json.effectiveAccess.branchIds, []);
  });

  it('permite alterar o horario da Filial e denuncia tabelas sem porteiro', async () => {
    const replaced = await http(`/branches/${branchAId}/operating-hours`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
      body: JSON.stringify({
        timezone: 'America/Sao_Paulo',
        days: [
          { weekday: 0, isOpen: false, opensAt: null, closesAt: null, cutoffAt: null },
          { weekday: 1, isOpen: true, opensAt: '10:00', closesAt: '19:00', cutoffAt: '19:00' },
          { weekday: 2, isOpen: true, opensAt: '09:30', closesAt: '18:00', cutoffAt: '18:00' },
          { weekday: 3, isOpen: true, opensAt: '09:30', closesAt: '18:00', cutoffAt: '18:00' },
          { weekday: 4, isOpen: true, opensAt: '09:30', closesAt: '18:00', cutoffAt: '18:00' },
          { weekday: 5, isOpen: true, opensAt: '09:30', closesAt: '18:00', cutoffAt: '18:00' },
          { weekday: 6, isOpen: true, opensAt: '09:30', closesAt: '13:00', cutoffAt: '13:00' },
        ],
      }),
    });
    assert.equal(replaced.status, 200);
    const monday = replaced.json.days.find((day) => day.weekday === 1);
    assert.equal(monday.opensAt.slice(0, 5), '10:00');
    assert.equal(monday.cutoffAt.slice(0, 5), '19:00');

    const report = await http('/tenancy/isolation-report', {
      headers: { authorization: `Bearer ${adminAToken}`, 'x-tenant-id': tenantAId },
    });
    assert.equal(report.status, 200);
    assert.equal(report.json.allProtected, true);
    assert.deepEqual(report.json.unprotected, []);
  });
});
