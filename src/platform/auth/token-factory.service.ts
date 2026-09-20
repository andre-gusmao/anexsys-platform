import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

export interface AuthTokenPayload {
  sub: string;
  tenantId: string;
  sessionId: string;
  branchIds: string[];
  permissions: string[];
}

export interface RefreshTokenPayload extends AuthTokenPayload {
  jti: string;
  nonce: string;
  tokenType: 'refresh';
}

export interface AccessTokenPayload extends AuthTokenPayload {
  tokenType: 'access';
}

export interface IssuedAuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenId: string;
}

@Injectable()
export class TokenFactoryService {
  constructor(private readonly jwtService: JwtService) {}

  async issueTokens(payload: Omit<AuthTokenPayload, 'sessionId'>, refreshTokenId: string = randomUUID()): Promise<IssuedAuthTokens> {
    const tokenPayload = { ...payload, sessionId: refreshTokenId };
    const accessToken = await this.jwtService.signAsync(
      { ...tokenPayload, tokenType: 'access' satisfies AccessTokenPayload['tokenType'] },
      {
        expiresIn: '15m',
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        ...tokenPayload,
        jti: refreshTokenId,
        nonce: randomUUID(),
        tokenType: 'refresh' satisfies RefreshTokenPayload['tokenType'],
      },
      {
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenHash: this.hashToken(refreshToken),
      refreshTokenId,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token);
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  compareTokenHash(rawToken: string, hashedToken: string): boolean {
    const incomingBuffer = Buffer.from(this.hashToken(rawToken), 'hex');
    const storedBuffer = Buffer.from(hashedToken, 'hex');
    return incomingBuffer.length === storedBuffer.length && timingSafeEqual(incomingBuffer, storedBuffer);
  }
}
