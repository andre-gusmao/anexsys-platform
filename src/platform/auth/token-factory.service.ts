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

  async issueTokens(payload: AuthTokenPayload): Promise<IssuedAuthTokens> {
    const refreshTokenId = randomUUID();
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      subject: payload.sub,
    });
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: refreshTokenId, tokenType: 'refresh' },
      {
        expiresIn: '7d',
        subject: payload.sub,
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
