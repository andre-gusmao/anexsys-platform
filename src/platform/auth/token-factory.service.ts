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
  tokenType: 'refresh';
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
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: refreshTokenId, tokenType: 'refresh' },
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

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token);
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
