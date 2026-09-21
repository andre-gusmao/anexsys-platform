import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { Client } from 'pg';

const require = createRequire(import.meta.url);
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');

const DB_NAME = 'anexsys_sprint1_integration';
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT ?? 5432);
const DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_SCHEMA = process.env.DB_SCHEMA ?? 'public';
const JWT_SECRET = process.env.JWT_SECRET ?? 'anexsys-integration-secret';

let app;
let baseUrl = '';
let tenantOneId = '';
let tenantTwoId = '';
let branchOneId = '';
let branchTwoId = '';
let adminToken = '';
let adminRefreshToken = '';
let adminSessionId = '';
let limitedUserToken = '';

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
    code: 'TENANT1',
    legalName: 'Tenant One Ltda',
    displayName: 'Tenant One',
    actorUserId: bootstrapActorId,
  });
  tenantOneId = tenantOne.id;

  const branchOne = await branchService.create({
    tenantId: tenantOne.id,
    code: 'BR1',
    legalName: 'Branch One Ltda',
    displayName: 'Branch One',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Main Calendar',
  });
  branchOneId = branchOne.id;

  const branchTwo = await branchService.create({
    tenantId: tenantOne.id,
    code: 'BR2',
    legalName: 'Branch Two Ltda',
    displayName: 'Branch Two',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Secondary Calendar',
  });
  branchTwoId = branchTwo.id;

  const tenantTwo = await tenantService.create({
    code: 'TENANT2',
    legalName: 'Tenant Two Ltda',
    displayName: 'Tenant Two',
    actorUserId: bootstrapActorId,
  });
  tenantTwoId = tenantTwo.id;

  await branchService.create({
    tenantId: tenantTwo.id,
    code: 'BRX',
    legalName: 'Tenant Two Branch',
    displayName: 'Tenant Two Branch',
    actorUserId: bootstrapActorId,
    businessCalendarName: 'Tenant Two Calendar',
  });

  const adminUser = await identityService.createUser({
    tenantId: tenantOne.id,
    defaultBranchId: branchOne.id,
    email: 'admin@tenant1.test',
    displayName: 'Tenant Admin',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const limitedUser = await identityService.createUser({
    tenantId: tenantOne.id,
    defaultBranchId: branchOne.id,
    email: 'limited@tenant1.test',
    displayName: 'Limited User',
    password: 'SuperSecret123',
    actorUserId: bootstrapActorId,
  });

  const role = await authorizationService.createRole({
    tenantId: tenantOne.id,
    code: 'TENANT_ADMIN',
    displayName: 'Tenant Admin',
    actorUserId: adminUser.id,
  });

  for (const permissionCode of [
    'tenants.read',
    'tenants.write',
    'branches.read',
    'branches.write',
    'roles.read',
    'roles.write',
    'permissions.read',
    'permissions.write',
    'users.read',
    'users.write',
  ]) {
    const permission = await authorizationService.createPermission({
      tenantId: tenantOne.id,
      code: permissionCode,
      displayName: permissionCode,
      actorUserId: adminUser.id,
    });

    await authorizationService.assignPermissionToRole({
      tenantId: tenantOne.id,
      roleId: role.id,
      permissionId: permission.id,
      actorUserId: adminUser.id,
    });
  }

  await authorizationService.assignRole({
    tenantId: tenantOne.id,
    userId: adminUser.id,
    roleId: role.id,
    assignedBranchId: branchOne.id,
    actorUserId: adminUser.id,
  });

  await authorizationService.assignBranchScope({
    tenantId: tenantOne.id,
    userId: adminUser.id,
    branchId: branchOne.id,
    scopeType: 'admin',
    actorUserId: adminUser.id,
  });

  await authorizationService.assignBranchScope({
    tenantId: tenantOne.id,
    userId: limitedUser.id,
    branchId: branchOne.id,
    scopeType: 'member',
    actorUserId: adminUser.id,
  });

  const adminLogin = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@tenant1.test',
      password: 'SuperSecret123',
    }),
  });
  adminToken = adminLogin.json.accessToken;
  adminRefreshToken = adminLogin.json.refreshToken;
  adminSessionId = adminLogin.json.sessionId;

  const limitedLogin = await http('/auth/login/password', {
    method: 'POST',
    body: JSON.stringify({ email: 'limited@tenant1.test',
      password: 'SuperSecret123',
    }),
  });
  limitedUserToken = limitedLogin.json.accessToken;
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

describe('Sprint 1 acceptance', () => {
  it('runs migrations successfully against PostgreSQL', async () => {
    const client = await adminClient(DB_NAME);
    const result = await client.query(`SELECT to_regclass('public.user_sessions') AS session_table`);
    await client.end();
    assert.equal(result.rows[0].session_table, 'user_sessions');
  });

  it('starts the application and completes the JWT authentication flow', async () => {
    const me = await http('/auth/me', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantOneId,
      },
    });

    assert.equal(me.status, 200);
    assert.equal(me.json.user.email, 'admin@tenant1.test');
    assert.ok(me.json.effectiveAccess.permissions.includes('users.write'));

    const refreshed = await http('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: adminRefreshToken }),
    });

    assert.equal(refreshed.status, 201);
    assert.equal(refreshed.json.sessionId, adminSessionId);
    assert.notEqual(refreshed.json.refreshToken, adminRefreshToken);
    adminToken = refreshed.json.accessToken;
    adminRefreshToken = refreshed.json.refreshToken;
  });

  it('enforces tenant isolation', async () => {
    const response = await http(`/tenants/${tenantTwoId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantOneId,
      },
    });

    assert.equal(response.status, 403);
  });

  it('enforces branch scope on branch routes', async () => {
    const allowed = await http(`/branches/${branchOneId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantOneId,
      },
    });
    const blocked = await http(`/branches/${branchTwoId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantOneId,
      },
    });

    assert.equal(allowed.status, 200);
    assert.equal(allowed.json.id, branchOneId);
    assert.equal(blocked.status, 403);
  });

  it('validates effective permissions on protected routes', async () => {
    const response = await http('/users/me/effective-permissions', {
      method: 'GET',
      headers: {
        authorization: 'Bearer ' + limitedUserToken,
        'x-tenant-id': tenantOneId,
      },
    });

    assert.equal(response.status, 403);
  });
  it('revokes the session on logout and blocks refresh reuse', async () => {
    const logout = await http('/auth/logout', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + adminToken,
        'x-tenant-id': tenantOneId,
      },
    });

    assert.equal(logout.status, 201);
    assert.equal(logout.json.success, true);

    const reuse = await http('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: adminRefreshToken }),
    });

    assert.equal(reuse.status, 401);
  });

});
