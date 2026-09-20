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
      async findActiveByUserId() {
        return [
          { roleId: 'role-1', assignedBranchId: 'branch-1' },
          { roleId: 'role-2', assignedBranchId: null },
        ];
      },
    };
    const userBranchScopeRepository = {
      async findByUserId() {
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

    const effectiveAccess = await service.getEffectiveAccessForUser('user-1');

    assert.deepEqual(effectiveAccess, {
      branchIds: ['branch-2', 'branch-1'],
      permissions: ['branch.manage', 'tenant.manage'],
    });
  });
});
