import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { IdentityModule } from 'src/modules/identity/identity.module';
import { CommunitiesController } from './http/communities.controller';
import { PermissionsController } from './http/permissions.controller';
import { RolesController } from './http/roles.controller';
import { AuthorizationService } from './application/authorization/authorization.service';
import { CommunityPermissionEntity } from './infrastructure/persistence/entities/community-permission.entity';
import { CommunityEntity } from './infrastructure/persistence/entities/community.entity';
import { PermissionEntity } from './infrastructure/persistence/entities/permission.entity';
import { RolePermissionEntity } from './infrastructure/persistence/entities/role-permission.entity';
import { RoleEntity } from './infrastructure/persistence/entities/role.entity';
import { UserBranchScopeEntity } from './infrastructure/persistence/entities/user-branch-scope.entity';
import { UserCommunityEntity } from './infrastructure/persistence/entities/user-community.entity';
import { UserRoleAssignmentEntity } from './infrastructure/persistence/entities/user-role-assignment.entity';
import { CommunityPermissionRepository } from './infrastructure/persistence/repositories/community-permission.repository';
import { CommunityRepository } from './infrastructure/persistence/repositories/community.repository';
import { PermissionRepository } from './infrastructure/persistence/repositories/permission.repository';
import { RolePermissionRepository } from './infrastructure/persistence/repositories/role-permission.repository';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { UserBranchScopeRepository } from './infrastructure/persistence/repositories/user-branch-scope.repository';
import { UserCommunityRepository } from './infrastructure/persistence/repositories/user-community.repository';
import { UserRoleAssignmentRepository } from './infrastructure/persistence/repositories/user-role-assignment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserRoleAssignmentEntity,
      UserBranchScopeEntity,
      CommunityEntity,
      CommunityPermissionEntity,
      UserCommunityEntity,
    ]),
    AuditModule,
    forwardRef(() => BranchModule),
    forwardRef(() => IdentityModule),
  ],
  controllers: [RolesController, PermissionsController, CommunitiesController],
  providers: [
    AuthorizationService,
    RoleRepository,
    PermissionRepository,
    RolePermissionRepository,
    UserRoleAssignmentRepository,
    UserBranchScopeRepository,
    CommunityRepository,
    CommunityPermissionRepository,
    UserCommunityRepository,
  ],
  exports: [
    AuthorizationService,
    RoleRepository,
    PermissionRepository,
    RolePermissionRepository,
    UserRoleAssignmentRepository,
    UserBranchScopeRepository,
    CommunityRepository,
    CommunityPermissionRepository,
    UserCommunityRepository,
  ],
})
export class AuthorizationModule {}
