import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { IdentityService } from 'src/modules/identity/application/identity/identity.service';
import { CreatePermissionDto } from 'src/modules/authorization/contracts/dto/create-permission.dto';
import { CreateRoleDto } from 'src/modules/authorization/contracts/dto/create-role.dto';
import { AssignBranchScopeDto } from 'src/modules/authorization/contracts/dto/assign-branch-scope.dto';
import { AssignPermissionToRoleDto } from 'src/modules/authorization/contracts/dto/assign-permission-to-role.dto';
import { AssignRoleDto } from 'src/modules/authorization/contracts/dto/assign-role.dto';
import { BranchScopeType, RoleStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { PermissionEntity } from '../../infrastructure/persistence/entities/permission.entity';
import { RoleEntity } from '../../infrastructure/persistence/entities/role.entity';
import { PermissionRepository } from '../../infrastructure/persistence/repositories/permission.repository';
import { RolePermissionRepository } from '../../infrastructure/persistence/repositories/role-permission.repository';
import { RoleRepository } from '../../infrastructure/persistence/repositories/role.repository';
import { UserBranchScopeRepository } from '../../infrastructure/persistence/repositories/user-branch-scope.repository';
import { UserRoleAssignmentRepository } from '../../infrastructure/persistence/repositories/user-role-assignment.repository';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly userBranchScopeRepository: UserBranchScopeRepository,
    private readonly identityService: IdentityService,
    private readonly branchService: BranchService,
    private readonly auditService: AuditService,
  ) {}

  async createRole(dto: CreateRoleDto): Promise<RoleEntity> {
    const role = this.roleRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      code: dto.code.trim().toUpperCase(),
      displayName: dto.displayName.trim(),
      description: dto.description?.trim() ?? null,
      status: RoleStatus.ACTIVE,
      isSystemManaged: dto.isSystemManaged ?? false,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const saved = await this.roleRepository.save(role);
    await this.auditService.record({
      tenantId: dto.tenantId,
      actorUserId: dto.actorUserId,
      entityType: 'role',
      entityId: saved.id,
      action: 'authorization.role.created',
      eventType: 'authorization.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async createPermission(dto: CreatePermissionDto): Promise<PermissionEntity> {
    const permission = this.permissionRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      code: dto.code.trim(),
      displayName: dto.displayName.trim(),
      description: dto.description?.trim() ?? null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const saved = await this.permissionRepository.save(permission);
    await this.auditService.record({
      tenantId: dto.tenantId,
      actorUserId: dto.actorUserId,
      entityType: 'permission',
      entityId: saved.id,
      action: 'authorization.permission.created',
      eventType: 'authorization.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async assignPermissionToRole(dto: AssignPermissionToRoleDto): Promise<void> {
    const role = await this.getRole(dto.roleId);
    const permission = await this.getPermission(dto.permissionId);
    if (role.tenantId !== dto.tenantId || permission.tenantId !== dto.tenantId) {
      throw new DomainValidationError('Role and permission must belong to the assignment tenant.');
    }

    const link = this.rolePermissionRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      roleId: dto.roleId,
      permissionId: dto.permissionId,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    await this.rolePermissionRepository.save(link);
    await this.auditService.record({
      tenantId: dto.tenantId,
      actorUserId: dto.actorUserId,
      entityType: 'role_permission',
      entityId: link.id,
      action: 'authorization.role.permission.assigned',
      eventType: 'authorization.write',
      metadata: { roleId: dto.roleId, permissionId: dto.permissionId },
    });
  }

  async assignRole(dto: AssignRoleDto): Promise<void> {
    const user = await this.identityService.getById(dto.userId);
    const role = await this.getRole(dto.roleId);
    if (user.tenantId !== dto.tenantId || role.tenantId !== dto.tenantId) {
      throw new DomainValidationError('User and role must belong to the assignment tenant.');
    }

    if (dto.assignedBranchId) {
      const branch = await this.branchService.getById(dto.assignedBranchId);
      if (branch.tenantId !== dto.tenantId) {
        throw new DomainValidationError('Assigned branch must belong to the same tenant.');
      }
    }

    const assignment = this.userRoleAssignmentRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      userId: dto.userId,
      roleId: dto.roleId,
      assignedBranchId: dto.assignedBranchId ?? null,
      assignedAt: new Date(),
      revokedAt: null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    await this.userRoleAssignmentRepository.save(assignment);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: dto.assignedBranchId ?? null,
      actorUserId: dto.actorUserId,
      entityType: 'user_role_assignment',
      entityId: assignment.id,
      action: 'authorization.role.assigned',
      eventType: 'authorization.write',
      metadata: { userId: dto.userId, roleId: dto.roleId },
    });
  }

  async assignBranchScope(dto: AssignBranchScopeDto): Promise<void> {
    const user = await this.identityService.getById(dto.userId);
    const branch = await this.branchService.getById(dto.branchId);
    if (user.tenantId !== dto.tenantId || branch.tenantId !== dto.tenantId) {
      throw new DomainValidationError('User and branch must belong to the assignment tenant.');
    }

    const scope = this.userBranchScopeRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      userId: dto.userId,
      branchId: dto.branchId,
      scopeType: dto.scopeType,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    await this.userBranchScopeRepository.save(scope);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'user_branch_scope',
      entityId: scope.id,
      action: 'authorization.branch.scope.assigned',
      eventType: 'authorization.write',
      metadata: { userId: dto.userId, scopeType: dto.scopeType },
    });
  }

  async listRoles(tenantId: string): Promise<RoleEntity[]> {
    return this.roleRepository.findByTenant(tenantId);
  }

  async listPermissions(tenantId: string): Promise<PermissionEntity[]> {
    return this.permissionRepository.findByTenant(tenantId);
  }

  async getEffectiveAccessForUser(tenantId: string, userId: string): Promise<{ branchIds: string[]; permissions: string[] }> {
    const assignments = await this.userRoleAssignmentRepository.findActiveByUserId(tenantId, userId);
    const roleIds = assignments.map((assignment) => assignment.roleId);
    const rolePermissions = await this.rolePermissionRepository.findByRoleIds(tenantId, roleIds);
    const permissions = await this.permissionRepository.findByIds(tenantId, [
      ...new Set(rolePermissions.map((rolePermission) => rolePermission.permissionId)),
    ]);
    const branchScopes = await this.userBranchScopeRepository.findByUserId(tenantId, userId);

    const branchIds = [
      ...branchScopes.map((scope) => scope.branchId),
      ...assignments
        .map((assignment) => assignment.assignedBranchId)
        .filter((branchId): branchId is string => Boolean(branchId)),
    ];

    return {
      branchIds: [...new Set(branchIds)],
      permissions: [...new Set(permissions.map((permission) => permission.code))].sort(),
    };
  }

  async userHasBranchScope(tenantId: string, userId: string, branchId: string, scopeType?: BranchScopeType): Promise<boolean> {
    const scopes = await this.userBranchScopeRepository.findByUserId(tenantId, userId);
    return scopes.some((scope) => scope.branchId === branchId && (!scopeType || scope.scopeType === scopeType));
  }

  private async getRole(roleId: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new EntityNotFoundError(`Role '${roleId}' was not found.`);
    }

    return role;
  }

  private async getPermission(permissionId: string): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new EntityNotFoundError(`Permission '${permissionId}' was not found.`);
    }

    return permission;
  }
}
