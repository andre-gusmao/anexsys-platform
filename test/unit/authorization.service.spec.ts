import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';

describe('AuthorizationService', () => {
  it('combines permissions and branch scopes into effective access', async () => {
    const permissionRepository = {
      async findByIds() {
        return [
          { id: 'permission-1', code: 'tenant.manage' },
          { id: 'permission-2', code: 'branch.manage' },
        ];
      },
    };
    const rolePermissionRepository = {
      async findByRoleIds() {
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

    const service = new AuthorizationService(
      {} as never,
      permissionRepository as never,
      rolePermissionRepository as never,
      userRoleAssignmentRepository as never,
      userBranchScopeRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const effectiveAccess = await service.getEffectiveAccessForUser('tenant-1', 'user-1');

    assert.deepEqual(effectiveAccess, {
      branchIds: ['branch-2', 'branch-1'],
      permissions: ['branch.manage', 'tenant.manage'],
    });
  });
});
