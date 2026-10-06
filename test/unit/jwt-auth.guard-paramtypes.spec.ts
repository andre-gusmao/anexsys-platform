import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from 'src/platform/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/platform/auth/permissions.guard';
import { TokenFactoryService } from 'src/platform/auth/token-factory.service';

describe('auth guard decorator metadata', () => {
  it('declares Reflector as an explicit inject token on JwtAuthGuard and PermissionsGuard', () => {
    const jwtInjected = (Reflect.getMetadata('self:paramtypes', JwtAuthGuard) ?? []) as Array<{
      index: number;
      param: unknown;
    }>;
    const permissionInjected = (Reflect.getMetadata('self:paramtypes', PermissionsGuard) ?? []) as Array<{
      index: number;
      param: unknown;
    }>;

    assert.equal(jwtInjected.find((item) => item.index === 0)?.param, Reflector);
    assert.equal(jwtInjected.find((item) => item.index === 1)?.param, TokenFactoryService);
    assert.equal(permissionInjected.find((item) => item.index === 0)?.param, Reflector);
  });

  it('lets a public login route through when Reflector is present', async () => {
    const reflector = {
      getAllAndOverride() {
        return true;
      },
    };
    const guard = new JwtAuthGuard(reflector as never, {} as never, {} as never);
    const allowed = await guard.canActivate({
      getHandler() {
        return {};
      },
      getClass() {
        return {};
      },
    } as never);
    assert.equal(allowed, true);
  });
});
