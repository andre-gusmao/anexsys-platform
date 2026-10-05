require('reflect-metadata');

const { randomUUID } = require('node:crypto');
const { NestFactory } = require('@nestjs/core');

const { AppModule } = require('./dist/app.module.js');
const { TenantService } = require('./dist/modules/tenant/application/tenant/tenant.service.js');
const { BranchService } = require('./dist/modules/branch/application/branch/branch.service.js');
const { IdentityService } = require('./dist/modules/identity/application/identity/identity.service.js');
const { AuthorizationService } = require('./dist/modules/authorization/application/authorization/authorization.service.js');
const { BranchScopeType } = require('./dist/shared/domain/enums.js');

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Defina a variavel de ambiente ${name} antes de executar este script.`);
  }
  return value.trim();
}

(async () => {
  const adminEmail = requireEnv('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
  const adminPassword = requireEnv('BOOTSTRAP_ADMIN_PASSWORD');

  const app = await NestFactory.createApplicationContext(
    AppModule,
    { logger: false }
  );

  try {
    const tenantService = app.get(TenantService);
    const branchService = app.get(BranchService);
    const identityService = app.get(IdentityService);
    const authorizationService = app.get(AuthorizationService);

    const bootstrapActorId = randomUUID();

    const tenant = await tenantService.create({
      code: 'ANXDEV',
      legalName: 'ANEXSYS DEV LTDA',
      displayName: 'ANEXSYS DEV',
      actorUserId: bootstrapActorId,
    });

    const branch = await branchService.create({
      tenantId: tenant.id,
      code: 'HQ',
      legalName: 'ANEXSYS DEV MATRIZ',
      displayName: 'Matriz',
      businessCalendarName: 'Calendario Local',
      actorUserId: bootstrapActorId,
    });

    const adminUser = await identityService.createUser({
      tenantId: tenant.id,
      defaultBranchId: branch.id,
      email: adminEmail,
      displayName: process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME ?? 'Administrador Local',
      password: adminPassword,
      actorUserId: bootstrapActorId,
    });

    console.log('BOOTSTRAP OK');
    console.log(
      JSON.stringify(
        {
          tenantId: tenant.id,
          branchId: branch.id,
          adminEmail,
        },
        null,
        2
      )
    );
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});