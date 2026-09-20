import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/modules/identity/application/auth/auth.service';
import { TokenFactoryService } from 'src/platform/auth/token-factory.service';

describe('AuthService', () => {
  it('persists a seven-day session expiry and matching session id on login', async () => {
    const savedSessions: Array<Record<string, unknown>> = [];
    const tokenFactoryService = new TokenFactoryService(new JwtService({ secret: 'unit-test-secret' }));
    const identityService = {
      async getByTenantAndEmail() {
        return {
          id: 'user-1',
          tenantId: 'tenant-1',
          defaultBranchId: 'branch-1',
          status: 'active',
        };
      },
    };
    const userCredentialRepository = {
      async findByUserId() {
        return { passwordHash: 'ignored' };
      },
    };
    const userSessionRepository = {
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        savedSessions.push(payload);
        return payload;
      },
    };
    const authorizationService = {
      async getEffectiveAccessForUser(tenantId: string, userId: string) {
        assert.equal(tenantId, 'tenant-1');
        assert.equal(userId, 'user-1');
        return { branchIds: ['branch-1'], permissions: ['tenant.manage'] };
      },
    };
    const passwordHasherService = {
      async verify(password: string) {
        assert.equal(password, 'super-secret-password');
        return true;
      },
    };
    const auditService = { async record() {} };

    const service = new AuthService(
      identityService as never,
      userCredentialRepository as never,
      userSessionRepository as never,
      authorizationService as never,
      passwordHasherService as never,
      tokenFactoryService,
      auditService as never,
    );

    const result = await service.loginWithPassword({
      tenantId: 'tenant-1',
      email: ' user@example.com ',
      password: 'super-secret-password',
    });

    assert.ok(savedSessions.length > 0);
    const session = savedSessions[0];
    assert.equal(session.id, result.sessionId);
    const issuedAt = session.issuedAt as Date;
    const expiresAt = session.expiresAt as Date;
    const diffMs = expiresAt.getTime() - issuedAt.getTime();
    assert.ok(diffMs >= 7 * 24 * 60 * 60 * 1000 - 1000);
    assert.ok(diffMs <= 7 * 24 * 60 * 60 * 1000 + 1000);
  });
});
