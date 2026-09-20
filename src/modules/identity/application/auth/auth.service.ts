import { Injectable } from '@nestjs/common';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { TokenFactoryService } from 'src/platform/auth/token-factory.service';
import { PasswordHasherService } from 'src/platform/auth/password-hasher.service';
import { AuthenticationFailedError } from 'src/shared/errors/authentication-failed.error';
import { LoginPasswordDto } from '../../contracts/dto/login-password.dto';
import { LogoutDto } from '../../contracts/dto/logout.dto';
import { RefreshTokenDto } from '../../contracts/dto/refresh-token.dto';
import { UserStatus, SessionStatus } from 'src/shared/domain/enums';
import { UserCredentialRepository } from '../../infrastructure/persistence/repositories/user-credential.repository';
import { UserSessionRepository } from '../../infrastructure/persistence/repositories/user-session.repository';
import { IdentityService } from '../identity/identity.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly identityService: IdentityService,
    private readonly userCredentialRepository: UserCredentialRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly tokenFactoryService: TokenFactoryService,
    private readonly auditService: AuditService,
  ) {}

  async loginWithPassword(dto: LoginPasswordDto): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    branchIds: string[];
    permissions: string[];
  }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.identityService.getByTenantAndEmail(dto.tenantId, normalizedEmail);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationFailedError();
    }

    const credential = await this.userCredentialRepository.findByUserId(user.id);
    if (!credential) {
      throw new AuthenticationFailedError();
    }

    const valid = await this.passwordHasherService.verify(dto.password, credential.passwordHash);
    if (!valid) {
      await this.auditService.record({
        tenantId: dto.tenantId,
        actorUserId: user.id,
        entityType: 'session',
        entityId: null,
        action: 'auth.login.failed',
        eventType: 'authentication.failed',
        metadata: { email: normalizedEmail },
      });
      throw new AuthenticationFailedError();
    }

    const effectiveAccess = await this.authorizationService.getEffectiveAccessForUser(user.tenantId, user.id);
    const issuedTokens = await this.tokenFactoryService.issueTokens({
      sub: user.id,
      tenantId: user.tenantId,
      branchIds: effectiveAccess.branchIds,
      permissions: effectiveAccess.permissions,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const session = this.userSessionRepository.create({
      id: issuedTokens.refreshTokenId,
      tenantId: user.tenantId,
      userId: user.id,
      refreshTokenHash: issuedTokens.refreshTokenHash,
      status: SessionStatus.ACTIVE,
      issuedAt: now,
      expiresAt,
      lastUsedAt: now,
      revokedAt: null,
      createdAt: now,
      createdBy: user.id,
      updatedAt: now,
      updatedBy: user.id,
    });

    await this.userSessionRepository.save(session);
    await this.auditService.record({
      tenantId: user.tenantId,
      branchId: user.defaultBranchId,
      actorUserId: user.id,
      entityType: 'session',
      entityId: session.id,
      action: 'auth.login.succeeded',
      eventType: 'authentication.succeeded',
    });

    return {
      accessToken: issuedTokens.accessToken,
      refreshToken: issuedTokens.refreshToken,
      sessionId: session.id,
      branchIds: effectiveAccess.branchIds,
      permissions: effectiveAccess.permissions,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    let payload;
    try {
      payload = await this.tokenFactoryService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new AuthenticationFailedError('Refresh token is invalid.');
    }

    if (payload.tokenType !== 'refresh') {
      throw new AuthenticationFailedError('Refresh token is invalid.');
    }
    const session = await this.userSessionRepository.findActiveById(payload.jti);
    if (!session) {
      throw new AuthenticationFailedError('Refresh token is not active.');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.revokeRefreshSession(session, payload.sub);
      throw new AuthenticationFailedError('Refresh token is not active.');
    }

    if (session.userId !== payload.sub || session.tenantId !== payload.tenantId) {
      await this.revokeRefreshSession(session, payload.sub);
      throw new AuthenticationFailedError('Refresh token session mismatch.');
    }

    if (!this.tokenFactoryService.compareTokenHash(dto.refreshToken, session.refreshTokenHash)) {
      await this.revokeRefreshSession(session, payload.sub);
      throw new AuthenticationFailedError('Refresh token is invalid.');
    }

    const user = await this.identityService.getById(payload.sub);
    if (user.tenantId !== payload.tenantId || user.status !== UserStatus.ACTIVE) {
      await this.revokeRefreshSession(session, payload.sub);
      throw new AuthenticationFailedError('Refresh token is not active.');
    }

    const effectiveAccess = await this.authorizationService.getEffectiveAccessForUser(payload.tenantId, payload.sub);
    const issuedTokens = await this.tokenFactoryService.issueTokens(
      {
        sub: payload.sub,
        tenantId: payload.tenantId,
        branchIds: effectiveAccess.branchIds,
        permissions: effectiveAccess.permissions,
      },
      session.id,
    );

    const rotated = await this.userSessionRepository.rotateRefreshToken({
      sessionId: session.id,
      expectedRefreshTokenHash: session.refreshTokenHash,
      refreshTokenHash: issuedTokens.refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      updatedBy: payload.sub,
    });
    if (!rotated) {
      throw new AuthenticationFailedError('Refresh token is not active.');
    }

    session.refreshTokenHash = issuedTokens.refreshTokenHash;
    session.lastUsedAt = new Date();
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    session.updatedAt = new Date();
    session.updatedBy = payload.sub;

    return {
      accessToken: issuedTokens.accessToken,
      refreshToken: issuedTokens.refreshToken,
      sessionId: session.id,
    };
  }


  private async revokeRefreshSession(session: {
    status: SessionStatus;
    revokedAt: Date | null;
    updatedAt: Date;
    updatedBy: string;
  }, actorUserId: string): Promise<void> {
    session.status = SessionStatus.REVOKED;
    session.revokedAt = new Date();
    session.updatedAt = new Date();
    session.updatedBy = actorUserId;
    await this.userSessionRepository.save(session as any);
  }

  async logout(dto: LogoutDto): Promise<void> {
    const session = await this.userSessionRepository.findActiveById(dto.sessionId);
    if (!session) {
      return;
    }

    if (session.userId !== dto.actorUserId) {
      throw new AuthenticationFailedError('Session revocation is not allowed.');
    }

    session.status = SessionStatus.REVOKED;
    session.revokedAt = new Date();
    session.updatedAt = new Date();
    session.updatedBy = dto.actorUserId;
    await this.userSessionRepository.save(session);
    await this.auditService.record({
      tenantId: session.tenantId,
      actorUserId: dto.actorUserId,
      entityType: 'session',
      entityId: session.id,
      action: 'auth.logout',
      eventType: 'authentication.logout',
    });
  }
}
