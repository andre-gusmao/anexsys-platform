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
