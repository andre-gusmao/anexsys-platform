import { AuditEventEntity } from 'src/modules/audit/infrastructure/persistence/entities/audit-event.entity';
import { RoleEntity } from 'src/modules/authorization/infrastructure/persistence/entities/role.entity';
import { PermissionEntity } from 'src/modules/authorization/infrastructure/persistence/entities/permission.entity';
import { RolePermissionEntity } from 'src/modules/authorization/infrastructure/persistence/entities/role-permission.entity';
import { UserBranchScopeEntity } from 'src/modules/authorization/infrastructure/persistence/entities/user-branch-scope.entity';
import { UserRoleAssignmentEntity } from 'src/modules/authorization/infrastructure/persistence/entities/user-role-assignment.entity';
import { BranchEntity } from 'src/modules/branch/infrastructure/persistence/entities/branch.entity';
import { CustomerEntity } from 'src/modules/crm/infrastructure/persistence/entities/customer.entity';
import { CustomerContactEntity } from 'src/modules/crm/infrastructure/persistence/entities/customer-contact.entity';
import { CustomerInteractionEntity } from 'src/modules/crm/infrastructure/persistence/entities/customer-interaction.entity';
import { MeasurementRecordEntity } from 'src/modules/crm/infrastructure/persistence/entities/measurement-record.entity';
import { UserCredentialEntity } from 'src/modules/identity/infrastructure/persistence/entities/user-credential.entity';
import { UserIdentityEntity } from 'src/modules/identity/infrastructure/persistence/entities/user-identity.entity';
import { UserSessionEntity } from 'src/modules/identity/infrastructure/persistence/entities/user-session.entity';
import { TenantEntity } from 'src/modules/tenant/infrastructure/persistence/entities/tenant.entity';

export const typeOrmEntities = [
  TenantEntity,
  BranchEntity,
  CustomerEntity,
  CustomerContactEntity,
  CustomerInteractionEntity,
  MeasurementRecordEntity,
  UserIdentityEntity,
  UserCredentialEntity,
  UserSessionEntity,
  RoleEntity,
  PermissionEntity,
  RolePermissionEntity,
  UserRoleAssignmentEntity,
  UserBranchScopeEntity,
  AuditEventEntity,
] as const;
