import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IS_PUBLIC_KEY } from 'src/platform/auth/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from 'src/platform/auth/permissions.decorator';
import { TenantsController } from 'src/modules/tenant/http/tenants.controller';

describe('TenantsController security', () => {
  it('does not expose tenant creation to the public', () => {
    const handler = TenantsController.prototype.create;
    assert.notEqual(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true);
  });

  it('requires the platform permission to create a tenant', () => {
    const handler = TenantsController.prototype.create;
    assert.deepEqual(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, handler), ['platform.tenants.create']);
  });
});
