import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IdentityService } from 'src/modules/identity/application/identity/identity.service';

describe('IdentityService', () => {
  it('creates a user and stores a hashed credential', async () => {
    const credentialSaves: Array<Record<string, unknown>> = [];
    const userIdentityRepository = {
      async findByTenantAndEmail() {
        return null;
      },
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
      },
      async findById() {
        return null;
      },
    };
    const userCredentialRepository = {
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        credentialSaves.push(payload);
        return payload;
      },
    };
    const tenantService = { async getById() { return { id: 'tenant-1' }; } };
    const branchService = {
      async getById() {
        return { id: 'branch-1', tenantId: 'tenant-1' };
      },
    };
    const passwordHasherService = {
      async hash(password: string) {
        return `hashed:${password}`;
      },
    };
    const auditService = { async record() {} };

    const service = new IdentityService(
      userIdentityRepository as never,
      userCredentialRepository as never,
      tenantService as never,
      branchService as never,
      passwordHasherService as never,
      auditService as never,
    );

    const user = await service.createUser({
      tenantId: 'tenant-1',
      defaultBranchId: 'branch-1',
      email: 'USER@EXAMPLE.COM',
      displayName: 'Main User',
      password: 'super-secret-password',
      actorUserId: 'actor-1',
    });

    assert.equal(user.email, 'user@example.com');
    assert.equal(credentialSaves[0]?.passwordHash, 'hashed:super-secret-password');
  });
});
