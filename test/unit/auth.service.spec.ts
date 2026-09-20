import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/modules/identity/application/auth/auth.service';
import { AuthenticationFailedError } from 'src/shared/errors/authentication-failed.error';
import { TokenFactoryService } from 'src/platform/auth/token-factory.service';

function buildAuthService(overrides?: {
  session?: Record<string, unknown> | null;
  verifyPassword?: boolean;
  token?: string;
  access?: { branchIds: string[]; permissions: string[] };
}) {
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
  const session = overrides?.session ?? null;
  const userSessionRepository = {
    create(payload: Record<string, unknown>) {
      return payload;
    },
    async save(payload: Record<string, unknown>) {
      savedSessions.push(payload);
      return payload;
    },
    async findActiveById() {
      return session;
    },
  };
  const authorizationService = {
    async getEffectiveAccessForUser(tenantId: string, userId: string) {
      assert.equal(tenantId, 'tenant-1');
      assert.equal(userId, 'user-1');
      return overrides?.access ?? { branchIds: ['branch-1'], permissions: ['tenant.manage'] };
    },
  };
  const passwordHasherService = {
    async verify(password: string) {
      assert.equal(password, 'super-secret-password');
      return overrides?.verifyPassword ?? true;
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

  return { service, savedSessions, tokenFactoryService };
}

describe('AuthService', () => {
  it('persists a seven-day session expiry and matching session id on login', async () => {
    const { service, savedSessions } = buildAuthService();

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

  it('refreshes tokens and extends session expiry', async () => {
    const tokenFactoryService = new TokenFactoryService(new JwtService({ secret: 'unit-test-secret' }));
    const firstTokens = await tokenFactoryService.issueTokens({
      sub: 'user-1',
      tenantId: 'tenant-1',
      branchIds: ['branch-1'],
      permissions: ['tenant.manage'],
    });
    const session = {
      id: firstTokens.refreshTokenId,
      tenantId: 'tenant-1',
      userId: 'user-1',
      refreshTokenHash: firstTokens.refreshTokenHash,
      status: 'active',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      lastUsedAt: new Date(),
      revokedAt: null,
      updatedAt: new Date(),
      updatedBy: 'user-1',
    };
    const { service } = buildAuthService({ session });

    const refreshed = await service.refreshTokens({ refreshToken: firstTokens.refreshToken });

    assert.equal(refreshed.sessionId, firstTokens.refreshTokenId);
    assert.notEqual(refreshed.refreshToken, firstTokens.refreshToken);
    assert.equal(session.refreshTokenHash.length > 0, true);
    assert.ok(session.expiresAt.getTime() > Date.now() + 6 * 24 * 60 * 60 * 1000);
  });

  it('rejects refresh with a non-refresh token payload', async () => {
    const tokenFactoryService = new TokenFactoryService(new JwtService({ secret: 'unit-test-secret' }));
    const accessToken = await new JwtService({ secret: 'unit-test-secret' }).signAsync({
      sub: 'user-1',
      tenantId: 'tenant-1',
      branchIds: ['branch-1'],
      permissions: ['tenant.manage'],
      jti: 'session-1',
      tokenType: 'access',
    });
    const { service } = buildAuthService({
      session: {
        id: 'session-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        refreshTokenHash: tokenFactoryService.hashToken(accessToken),
        status: 'active',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await assert.rejects(() => service.refreshTokens({ refreshToken: accessToken }), AuthenticationFailedError);
  });

  it('rejects refresh when session and token do not match', async () => {
    const tokenFactoryService = new TokenFactoryService(new JwtService({ secret: 'unit-test-secret' }));
    const tokens = await tokenFactoryService.issueTokens({
      sub: 'user-1',
      tenantId: 'tenant-1',
      branchIds: ['branch-1'],
      permissions: ['tenant.manage'],
    });
    const { service } = buildAuthService({
      session: {
        id: tokens.refreshTokenId,
        tenantId: 'tenant-1',
        userId: 'user-2',
        refreshTokenHash: tokens.refreshTokenHash,
        status: 'active',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await assert.rejects(() => service.refreshTokens({ refreshToken: tokens.refreshToken }), AuthenticationFailedError);
  });

  it('rejects refresh when the token hash does not match the active session', async () => {
    const tokenFactoryService = new TokenFactoryService(new JwtService({ secret: 'unit-test-secret' }));
    const tokens = await tokenFactoryService.issueTokens({
      sub: 'user-1',
      tenantId: 'tenant-1',
      branchIds: ['branch-1'],
      permissions: ['tenant.manage'],
    });
    const { service } = buildAuthService({
      session: {
        id: tokens.refreshTokenId,
        tenantId: 'tenant-1',
        userId: 'user-1',
        refreshTokenHash: 'different-hash',
        status: 'active',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await assert.rejects(() => service.refreshTokens({ refreshToken: tokens.refreshToken }), AuthenticationFailedError);
  });

  it('rejects refresh when the session is inactive or expired', async () => {
    const tokenFactoryService = new TokenFactoryService(new JwtService({ secret: 'unit-test-secret' }));
    const tokens = await tokenFactoryService.issueTokens({
      sub: 'user-1',
      tenantId: 'tenant-1',
      branchIds: ['branch-1'],
      permissions: ['tenant.manage'],
    });
    const { service } = buildAuthService({
      session: {
        id: tokens.refreshTokenId,
        tenantId: 'tenant-1',
        userId: 'user-1',
        refreshTokenHash: tokens.refreshTokenHash,
        status: 'active',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    await assert.rejects(() => service.refreshTokens({ refreshToken: tokens.refreshToken }), AuthenticationFailedError);
  });
});
