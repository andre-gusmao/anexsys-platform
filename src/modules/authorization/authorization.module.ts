import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from 'src/modules/audit/audit.module';
import { BranchModule } from 'src/modules/branch/branch.module';
import { IdentityModule } from 'src/modules/identity/identity.module';
import { AuthorizationService } from './application/authorization/authorization.service';
import { PermissionEntity } from './infrastructure/persistence/entities/permission.entity';
import { RolePermissionEntity } from './infrastructure/persistence/entities/role-permission.entity';
import { RoleEntity } from './infrastructure/persistence/entities/role.entity';
import { UserBranchScopeEntity } from './infrastructure/persistence/entities/user-branch-scope.entity';
import { UserRoleAssignmentEntity } from './infrastructure/persistence/entities/user-role-assignment.entity';
import { PermissionRepository } from './infrastructure/persistence/repositories/permission.repository';
import { RolePermissionRepository } from './infrastructure/persistence/repositories/role-permission.repository';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { UserBranchScopeRepository } from './infrastructure/persistence/repositories/user-branch-scope.repository';
import { UserRoleAssignmentRepository } from './infrastructure/persistence/repositories/user-role-assignment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserRoleAssignmentEntity,
      UserBranchScopeEntity,
    ]),
    AuditModule,
    BranchModule,
    forwardRef(() => IdentityModule),
  ],
  providers: [
    AuthorizationService,
    RoleRepository,
    PermissionRepository,
    RolePermissionRepository,
    UserRoleAssignmentRepository,
    UserBranchScopeRepository,
  ],
  exports: [
    AuthorizationService,
    RoleRepository,
    PermissionRepository,
    RolePermissionRepository,
    UserRoleAssignmentRepository,
    UserBranchScopeRepository,
  ],
})
export class AuthorizationModule {}
