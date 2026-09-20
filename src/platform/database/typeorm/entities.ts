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
import { OperationalResourceBranchScopeEntity } from 'src/modules/operational-resources/infrastructure/persistence/entities/operational-resource-branch-scope.entity';
import { OperationalResourceEntity } from 'src/modules/operational-resources/infrastructure/persistence/entities/operational-resource.entity';
import { ProductionExecutionEventEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/production-execution-event.entity';
import { QualityRecordEntity } from 'src/modules/quality/infrastructure/persistence/entities/quality-record.entity';
import { CustomerRejectionEntity } from 'src/modules/quality/infrastructure/persistence/entities/customer-rejection.entity';
import { ReworkCaseEntity } from 'src/modules/rework/infrastructure/persistence/entities/rework-case.entity';
import { WarrantyAdjustmentEntity } from 'src/modules/warranty/infrastructure/persistence/entities/warranty-adjustment.entity';
import { WarrantyExecutionEntity } from 'src/modules/warranty/infrastructure/persistence/entities/warranty-execution.entity';
import { ProductionOrderOperationalAssignmentEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/production-order-operational-assignment.entity';
import { ProductionOrderItemLinkEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/production-order-item-link.entity';
import { ProductionOrderVersionEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/production-order-version.entity';
import { ProductionOrderEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/production-order.entity';
import { QrCodeEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/qr-code.entity';
import { QrEventEntity } from 'src/modules/production-orders/infrastructure/persistence/entities/qr-event.entity';
import { BusinessCalendarDayEntity } from 'src/modules/service-orders/infrastructure/persistence/entities/business-calendar-day.entity';
import { ServiceOrderEntity } from 'src/modules/service-orders/infrastructure/persistence/entities/service-order.entity';
import { ServiceOrderItemEntity } from 'src/modules/service-orders/infrastructure/persistence/entities/service-order-item.entity';
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
  OperationalResourceEntity,
  OperationalResourceBranchScopeEntity,
  ProductionOrderEntity,
  ProductionOrderItemLinkEntity,
  ProductionOrderVersionEntity,
  ProductionOrderOperationalAssignmentEntity,
  QrCodeEntity,
  QrEventEntity,
  ProductionExecutionEventEntity,
  QualityRecordEntity,
  CustomerRejectionEntity,
  ReworkCaseEntity,
  WarrantyAdjustmentEntity,
  WarrantyExecutionEntity,
  BusinessCalendarDayEntity,
  ServiceOrderEntity,
  ServiceOrderItemEntity,
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
