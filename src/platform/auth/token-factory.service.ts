import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';

export interface AuthTokenPayload {
  sub: string;
  tenantId: string;
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

  async issueTokens(payload: AuthTokenPayload, refreshTokenId: string = randomUUID()): Promise<IssuedAuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { ...payload, tokenType: 'access' satisfies AccessTokenPayload['tokenType'] },
      {
        expiresIn: '15m',
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        ...payload,
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
}
