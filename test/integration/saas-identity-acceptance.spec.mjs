import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_saas_identity_integration';
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT ?? 5432);
const DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';
const JWT_SECRET = process.env.JWT_SECRET ?? 'anexsys-saas-identity-secret';

let app;
let baseUrl = '';
let tenantOneId = '';
let tenantTwoId = '';
let branchOneId = '';
let branchTwoId = '';
let branchTenantTwoId = '';
let adminToken = '';
let sharedLogin = null;
let sharedAccessToken = '';

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
  const bootstrapActorId = randomUUID();

  const tenantOne = await tenantService.create({
    code: 'MAT',
    legalName: 'Matriz Ltda',
    displayName: 'Matriz',
    actorUserId: bootstrapActorId,
  });
  tenantOneId = tenantOne.id;

  const tenantTwo = await tenantService.create({
    code: 'FIL',
    legalName: 'Filial Ltda',
    displayName: 'Unidade Filial',
    actorUserId: bootstrapActorId,
  });
  tenantTwoId = tenantTwo.id;

  const branchOne = await branchService.create({
    tenantId: tenantOneId,
    code: 'MAT-01',
    legalName: 'Matriz One',
    displayName: 'Matriz One',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Main Calendar',
  });
  branchOneId = branchOne.id;

  const branchTwo = await branchService.create({
    tenantId: tenantOneId,
    code: 'MAT-02',
    legalName: 'Matriz Two',
    displayName: 'Matriz Two',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Secondary Calendar',
  });
  branchTwoId = branchTwo.id;

  const branchTenantTwo = await branchService.create({
    tenantId: tenantTwoId,
    code: 'FIL-01',
    legalName: 'Filial One',
    displayName: 'Filial One',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Filial Calendar',
  });
  branchTenantTwoId = branchTenantTwo.id;

  const admin = await identityService.createUser({
    tenantId: tenantOneId,
    defaultBranchId: branchOneId,
    email: 'admin@identity.test',
    displayName: 'Identity Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const sharedTenantOne = await identityService.createUser({
    tenantId: tenantOneId,
    defaultBranchId: branchOneId,
    email: 'shared@identity.test',
    displayName: 'Shared Matriz User',
    password: 'SharedSecret123',
    actorUserId: bootstrapActorId,
  });

  const sharedTenantTwo = await identityService.createUser({
    tenantId: tenantTwoId,
    defaultBranchId: branchTenantTwoId,
    email: 'shared@identity.test',
    displayName: 'Shared Filial User',
    password: 'SharedSecret123',
    actorUserId: bootstrapActorId,
  });

  const adminRole = await authorizationService.createRole({
    tenantId: tenantOneId,
    code: 'TENANT_ADMIN',
    displayName: 'Tenant Admin',
    actorUserId: admin.id,
  });

  for (const permissionCode of ['users.read', 'users.write', 'branches.read', 'communities.read', 'communities.write']) {
    const permission = await authorizationService.createPermission({
      tenantId: tenantOneId,
      code: permissionCode,
      displayName: permissionCode,
      actorUserId: admin.id,
    });
    await authorizationService.assignPermissionToRole({
      tenantId: tenantOneId,
      roleId: adminRole.id,
      permissionId: permission.id,
      actorUserId: admin.id,
    });
  }

  await authorizationService.assignRole({
    tenantId: tenantOneId,
    userId: admin.id,
    roleId: adminRole.id,
    assignedBranchId: branchOneId,
    actorUserId: admin.id,
  });
  await authorizationService.assignBranchScope({
    tenantId: tenantOneId,
    userId: admin.id,
    branchId: branchOneId,
    scopeType: 'admin',
    actorUserId: admin.id,
  });

  const dashboardRoleOne = await authorizationService.createRole({
    tenantId: tenantOneId,
    code: 'DASHBOARD',
    displayName: 'Dashboard',
    actorUserId: admin.id,
  });
  const dashboardPermissionOne = await authorizationService.createPermission({
    tenantId: tenantOneId,
    code: 'dashboard.read',
    displayName: 'dashboard.read',
    actorUserId: admin.id,
  });
  await authorizationService.assignPermissionToRole({
    tenantId: tenantOneId,
    roleId: dashboardRoleOne.id,
    permissionId: dashboardPermissionOne.id,
    actorUserId: admin.id,
  });
  await authorizationService.assignRole({
    tenantId: tenantOneId,
    userId: sharedTenantOne.id,
    roleId: dashboardRoleOne.id,
    assignedBranchId: branchOneId,
    actorUserId: admin.id,
  });
  await authorizationService.assignBranchScope({
    tenantId: tenantOneId,
    userId: sharedTenantOne.id,
    branchId: branchOneId,
    scopeType: 'member',
    actorUserId: admin.id,
  });

  const dashboardRoleTwo = await authorizationService.createRole({
    tenantId: tenantTwoId,
    code: 'DASHBOARD',
    displayName: 'Dashboard',
    actorUserId: bootstrapActorId,
  });
  const dashboardPermissionTwo = await authorizationService.createPermission({
    tenantId: tenantTwoId,
    code: 'dashboard.read',
    displayName: 'dashboard.read',
    actorUserId: bootstrapActorId,
  });
  await authorizationService.assignPermissionToRole({
    tenantId: tenantTwoId,
    roleId: dashboardRoleTwo.id,
    permissionId: dashboardPermissionTwo.id,
    actorUserId: bootstrapActorId,
  });
  await authorizationService.assignRole({
    tenantId: tenantTwoId,
    userId: sharedTenantTwo.id,
    roleId: dashboardRoleTwo.id,
    assignedBranchId: branchTenantTwoId,
    actorUserId: bootstrapActorId,
  });
  await authorizationService.assignBranchScope({
    tenantId: tenantTwoId,
    userId: sharedTenantTwo.id,
    branchId: branchTenantTwoId,
    scopeType: 'member',
    actorUserId: bootstrapActorId,
  });

  const adminLogin = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@identity.test', password: 'SuperSecret123' }),
  });
  adminToken = adminLogin.json.accessToken;

  sharedLogin = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'shared@identity.test', password: 'SharedSecret123' }),
  });
  sharedAccessToken = sharedLogin.json.accessToken;
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

describe('SaaS identity acceptance', () => {
  it('authenticates with email/password only and exposes the company selector plus role-based permissions', async () => {
    assert.equal(sharedLogin.status, 201);
    assert.equal(sharedLogin.json.tenantId, tenantOneId);

    const me = await http('/auth/me', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + sharedAccessToken,
        'x-tenant-id': tenantOneId,
      },
    });

    assert.equal(me.status, 200);
    assert.equal(me.json.user.email, 'shared@identity.test');
    assert.equal(me.json.context.companySelectionRequired, true);
    assert.equal(me.json.context.availableCompanies.length, 2);
    assert.ok(me.json.effectiveAccess.permissions.includes('dashboard.read'));
    assert.deepEqual(me.json.effectiveAccess.communities, []);
  });

  it('switches company without reauthentication and remembers the last valid company and branch context', async () => {
    const switched = await http('/auth/context/company', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + sharedAccessToken,
        'x-tenant-id': tenantOneId,
      },
      body: JSON.stringify({ tenantId: tenantTwoId }),
    });

    assert.equal(switched.status, 201);
    assert.equal(switched.json.tenantId, tenantTwoId);
    sharedAccessToken = switched.json.accessToken;

    const selectBranch = await http('/auth/context/branch', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + sharedAccessToken,
        'x-tenant-id': tenantTwoId,
      },
      body: JSON.stringify({ branchId: branchTenantTwoId }),
    });
    assert.equal(selectBranch.status, 201);

    const me = await http('/auth/me', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + sharedAccessToken,
        'x-tenant-id': tenantTwoId,
        'x-branch-id': branchTenantTwoId,
      },
    });
    assert.equal(me.status, 200);
    assert.equal(me.json.context.tenantId, tenantTwoId);
    assert.equal(me.json.context.branchId, branchTenantTwoId);
    assert.ok(me.json.effectiveAccess.permissions.includes('dashboard.read'));
    assert.deepEqual(me.json.effectiveAccess.communities, []);

    const relogin = await http('/auth/login/password', {
      method: 'POST',
      body: JSON.stringify({ email: 'shared@identity.test', password: 'SharedSecret123' }),
    });
    assert.equal(relogin.status, 201);
    assert.equal(relogin.json.tenantId, tenantTwoId);

    const remembered = await http('/auth/me', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + relogin.json.accessToken,
        'x-tenant-id': tenantTwoId,
      },
    });
    assert.equal(remembered.status, 200);
    assert.equal(remembered.json.context.companySelectionRequired, false);
    assert.equal(remembered.json.context.branchId, branchTenantTwoId);
  });

  it('issues first access tokens, validates them, forces password creation, and enables later login', async () => {
    const invitation = await http('/users/invite', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantOneId,
      },
      body: JSON.stringify({
        defaultBranchId: branchTwoId,
        email: 'invited@identity.test',
        displayName: 'Invited User',
      }),
    });

    assert.equal(invitation.status, 201);
    assert.ok(invitation.json.firstAccess.token);

    const validation = await http('/auth/first-access/validate', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invited@identity.test',
        token: invitation.json.firstAccess.token,
      }),
    });
    assert.equal(validation.status, 201);
    assert.equal(validation.json.user.email, 'invited@identity.test');

    const completion = await http('/auth/first-access/complete', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invited@identity.test',
        token: invitation.json.firstAccess.token,
        password: 'InvitedSecret123',
      }),
    });
    assert.equal(completion.status, 201);
    assert.equal(completion.json.success, true);

    const login = await http('/auth/login/password', {
      method: 'POST',
      body: JSON.stringify({ email: 'invited@identity.test', password: 'InvitedSecret123' }),
    });
    assert.equal(login.status, 201);
    assert.equal(login.json.tenantId, tenantOneId);
  });
});
