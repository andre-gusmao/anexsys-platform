export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum BranchStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  INACTIVE = 'inactive',
}

export enum SessionStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum RoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum BranchScopeType {
  MEMBER = 'member',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum CustomerType {
  PERSON = 'person',
  COMPANY = 'company',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum CustomerInteractionType {
  PROFILE_CREATED = 'profile_created',
  PROFILE_UPDATED = 'profile_updated',
  STATUS_CHANGED = 'status_changed',
  MEASUREMENT_RECORDED = 'measurement_recorded',
}

export enum InteractionChannel {
  SYSTEM = 'system',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
}

export enum DeliveryType {
  STANDARD = 'Standard',
  PRIORITY = 'Priority',
  EXPRESS = 'Express',
}

export enum SurchargeMethod {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export enum ServiceOrderStatus {
  OPEN = 'open',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
}

export enum ServiceOrderItemStatus {
  OPEN = 'open',
  CANCELLED = 'cancelled',
}

export enum CalendarDayScope {
  TENANT = 'tenant',
  BRANCH = 'branch',
  HOLIDAY = 'holiday',
}


export enum ProductionOrderStatus {
  OPEN = 'open',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProductionOrderVersionReason {
  REWORK = 'rework',
  WARRANTY_EXECUTION = 'warranty_execution',
  CORRECTIVE_PRODUCTION = 'corrective_production',
}

export enum OperationalResourceType {
  EMPLOYEE = 'employee',
  DAILY_WORKER = 'daily_worker',
  CONTRACTOR = 'contractor',
}

export enum OperationalResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum OperationalAvailabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
}

export enum OperationalAssignmentRole {
  PRIMARY = 'primary',
  PARTICIPANT = 'participant',
}

export enum QrScanType {
  START_EXECUTION = 'start_execution',
  ASSUME_RESPONSIBILITY = 'assume_responsibility',
  UPDATE_STATUS = 'update_status',
  UPDATE_DIARY = 'update_diary',
}

export enum QrScanResult {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum ProductionExecutionEventType {
  EXECUTION_START = 'execution_start',
  RESPONSIBILITY_ASSUMED = 'responsibility_assumed',
  STATUS_UPDATED = 'status_updated',
  DIARY_UPDATED = 'diary_updated',
}
