import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

describe('AuthorizationService', () => {
  it('combines permissions and branch scopes into effective access', async () => {
    const permissionRepository = {
      async findByIds(tenantId: string) {
        assert.equal(tenantId, 'tenant-1');
        return [
          { id: 'permission-1', code: 'tenant.manage' },
          { id: 'permission-2', code: 'branch.manage' },
        ];
      },
    };
    const rolePermissionRepository = {
      async findByRoleIds(tenantId: string) {
        assert.equal(tenantId, 'tenant-1');
        return [
          { roleId: 'role-1', permissionId: 'permission-1' },
          { roleId: 'role-2', permissionId: 'permission-2' },
        ];
      },
    };
    const userRoleAssignmentRepository = {
      async findActiveByUserId(tenantId: string, userId: string) {
        assert.equal(tenantId, 'tenant-1');
        assert.equal(userId, 'user-1');
        return [
          { roleId: 'role-1', assignedBranchId: 'branch-1' },
          { roleId: 'role-2', assignedBranchId: null },
        ];
      },
    };
    const userBranchScopeRepository = {
      async findByUserId(tenantId: string, userId: string) {
        assert.equal(tenantId, 'tenant-1');
        assert.equal(userId, 'user-1');
        return [
          { branchId: 'branch-2', scopeType: 'member' },
          { branchId: 'branch-1', scopeType: 'manager' },
        ];
      },
    };
    const branchService = {
      async listByTenant(tenantId: string) {
        assert.equal(tenantId, 'tenant-1');
        return [{ id: 'branch-1' }, { id: 'branch-2' }];
      },
    };

    const service = new AuthorizationService(
      {} as never,
      permissionRepository as never,
      rolePermissionRepository as never,
      userRoleAssignmentRepository as never,
      userBranchScopeRepository as never,
      {} as never,
      branchService as never,
      {} as never,
    );

    const effectiveAccess = await service.getEffectiveAccessForUser('tenant-1', 'user-1');

    assert.deepEqual(effectiveAccess, {
      branchIds: ['branch-2', 'branch-1'],
      permissions: ['branch.manage', 'tenant.manage'],
    });
  });

  it('treats tenant-wide role assignments as access to all tenant branches', async () => {
    const branchService = {
      async listByTenant(tenantId: string) {
        assert.equal(tenantId, 'tenant-1');
        return [{ id: 'branch-a' }, { id: 'branch-b' }];
      },
    };
    const service = new AuthorizationService(
      {} as never,
      { async findByIds() { return []; } } as never,
      { async findByRoleIds() { return []; } } as never,
      { async findActiveByUserId() { return [{ roleId: 'role-1', assignedBranchId: null }]; } } as never,
      { async findByUserId() { return []; } } as never,
      {} as never,
      branchService as never,
      {} as never,
    );

    const access = await service.getEffectiveAccessForUser('tenant-1', 'user-1');

    assert.deepEqual(access.branchIds, ['branch-a', 'branch-b']);
  });

  it('rejects cross-tenant role assignments', async () => {
    const service = new AuthorizationService(
      { async findById() { return { id: 'role-1', tenantId: 'tenant-b' }; } } as never,
      {} as never,
      {} as never,
      { create() { return {}; }, async save() {} } as never,
      {} as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-a' }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.assignRole({
          tenantId: 'tenant-a',
          userId: 'user-1',
          roleId: 'role-1',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });

  it('rejects role assignments to a branch from a different tenant', async () => {
    const service = new AuthorizationService(
      { async findById() { return { id: 'role-1', tenantId: 'tenant-a' }; } } as never,
      {} as never,
      {} as never,
      { create() { return {}; }, async save() {} } as never,
      {} as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-a' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-b' }; } } as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.assignRole({
          tenantId: 'tenant-a',
          userId: 'user-1',
          roleId: 'role-1',
          assignedBranchId: 'branch-1',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });
});
