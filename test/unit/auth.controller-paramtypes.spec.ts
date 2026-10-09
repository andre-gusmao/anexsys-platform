import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { AuthController } from 'src/modules/identity/http/auth.controller';
import { AuthService } from 'src/modules/identity/application/auth/auth.service';
import { IdentityService } from 'src/modules/identity/application/identity/identity.service';
import { LoginAttemptLimiterService } from 'src/modules/identity/application/auth/login-attempt-limiter.service';

describe('AuthController decorator metadata', () => {
  it('declares login limiter as an explicit inject token', async () => {
    await import('src/modules/branch/application/branch/branch.service');
    const injected = (Reflect.getMetadata('self:paramtypes', AuthController) ?? []) as Array<{
      index: number;
      param: unknown;
    }>;

    assert.equal(injected.find((item) => item.index === 0)?.param, AuthService);
    assert.equal(injected.find((item) => item.index === 1)?.param, IdentityService);
    assert.equal(injected.find((item) => item.index === 2)?.param, LoginAttemptLimiterService);
  });
});
