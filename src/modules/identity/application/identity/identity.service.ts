import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { PasswordHasherService } from 'src/platform/auth/password-hasher.service';
import { UserStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CreateUserDto } from '../../contracts/dto/create-user.dto';
import { UserContextPreferenceEntity } from '../../infrastructure/persistence/entities/user-context-preference.entity';
import { UserCredentialEntity } from '../../infrastructure/persistence/entities/user-credential.entity';
import { UserIdentityEntity } from '../../infrastructure/persistence/entities/user-identity.entity';
import { UserContextPreferenceRepository } from '../../infrastructure/persistence/repositories/user-context-preference.repository';
import { UserCredentialRepository } from '../../infrastructure/persistence/repositories/user-credential.repository';
import { UserIdentityRepository } from '../../infrastructure/persistence/repositories/user-identity.repository';

export interface InviteUserDto {
  tenantId: string;
  defaultBranchId?: string;
  email: string;
  displayName: string;
  actorUserId: string;
}

@Injectable()
export class IdentityService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userIdentityRepository: UserIdentityRepository,
    private readonly userCredentialRepository: UserCredentialRepository,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly auditService: AuditService,
    private readonly userContextPreferenceRepository: UserContextPreferenceRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserIdentityEntity> {
    await this.assertTenantBranchConsistency(dto.tenantId, dto.defaultBranchId);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userIdentityRepository.findByTenantAndEmail(dto.tenantId, normalizedEmail);
    if (existing) {
      throw new DomainValidationError(`User email '${normalizedEmail}' already exists for this tenant.`);
    }

    const userId = randomUUID();
    const user = this.userIdentityRepository.create({
      id: userId,
      tenantId: dto.tenantId,
      defaultBranchId: dto.defaultBranchId ?? null,
      email: normalizedEmail,
      displayName: dto.displayName.trim(),
      status: UserStatus.ACTIVE,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const passwordHash = await this.passwordHasherService.hash(dto.password);
    const credential = this.userCredentialRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      userId,
      passwordHash,
      passwordAlgorithm: 'scrypt',
      passwordUpdatedAt: new Date(),
      mustRotatePassword: false,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const persistedUser = manager.create(UserIdentityEntity, user);
      const persistedCredential = manager.create(UserCredentialEntity, credential);
      await manager.save(UserIdentityEntity, persistedUser);
      await manager.save(UserCredentialEntity, persistedCredential);
      return persistedUser;
    });
    await this.auditService.record({
      tenantId: savedUser.tenantId,
      branchId: savedUser.defaultBranchId,
      actorUserId: dto.actorUserId,
      entityType: 'user_identity',
      entityId: savedUser.id,
      action: 'identity.user.created',
      eventType: 'identity.write',
      metadata: { email: savedUser.email },
    });

    return savedUser;
  }

  async inviteUser(dto: InviteUserDto): Promise<UserIdentityEntity> {
    await this.assertTenantBranchConsistency(dto.tenantId, dto.defaultBranchId);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userIdentityRepository.findByTenantAndEmail(dto.tenantId, normalizedEmail);
    if (existing) {
      throw new DomainValidationError(`User email '${normalizedEmail}' already exists for this tenant.`);
    }

    const user = this.userIdentityRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      defaultBranchId: dto.defaultBranchId ?? null,
      email: normalizedEmail,
      displayName: dto.displayName.trim(),
      status: UserStatus.INVITED,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const savedUser = await this.userIdentityRepository.save(user);
    await this.auditService.record({
      tenantId: savedUser.tenantId,
      branchId: savedUser.defaultBranchId,
      actorUserId: dto.actorUserId,
      entityType: 'user_identity',
      entityId: savedUser.id,
      action: 'identity.user.invited',
      eventType: 'identity.write',
      metadata: { email: savedUser.email },
    });

    return savedUser;
  }

  async setPassword(params: {
    tenantId: string;
    userId: string;
    password: string;
    actorUserId: string;
    mustRotatePassword?: boolean;
    activateUser?: boolean;
  }): Promise<UserIdentityEntity> {
    const user = await this.getById(params.userId);
    if (user.tenantId !== params.tenantId) {
      throw new DomainValidationError('User is outside the tenant scope.');
    }

    const existingCredential = await this.userCredentialRepository.findByUserId(user.id);
    const passwordHash = await this.passwordHasherService.hash(params.password);
    const now = new Date();

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const nextUser = manager.create(UserIdentityEntity, {
        ...user,
        status: params.activateUser ? UserStatus.ACTIVE : user.status,
        updatedBy: params.actorUserId,
      });

      const credential = existingCredential
        ? manager.create(UserCredentialEntity, {
            ...existingCredential,
            passwordHash,
            passwordUpdatedAt: now,
            mustRotatePassword: params.mustRotatePassword ?? false,
            updatedBy: params.actorUserId,
          })
        : manager.create(UserCredentialEntity, {
            id: randomUUID(),
            tenantId: user.tenantId,
            userId: user.id,
            passwordHash,
            passwordAlgorithm: 'scrypt',
            passwordUpdatedAt: now,
            mustRotatePassword: params.mustRotatePassword ?? false,
            createdBy: params.actorUserId,
            updatedBy: params.actorUserId,
          });

      await manager.save(UserIdentityEntity, nextUser);
      await manager.save(UserCredentialEntity, credential);
      return nextUser;
    });

    await this.auditService.record({
      tenantId: savedUser.tenantId,
      branchId: savedUser.defaultBranchId,
      actorUserId: params.actorUserId,
      entityType: 'user_identity',
      entityId: savedUser.id,
      action: 'identity.password.updated',
      eventType: 'identity.write',
      metadata: { activated: params.activateUser ?? false },
    });

    return savedUser;
  }

  async getById(id: string): Promise<UserIdentityEntity> {
    const user = await this.userIdentityRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundError(`User '${id}' was not found.`);
    }

    return user;
  }

  async getByTenantAndEmail(tenantId: string, email: string): Promise<UserIdentityEntity | null> {
    return this.userIdentityRepository.findByTenantAndEmail(tenantId, email);
  }

  async listByEmail(email: string): Promise<UserIdentityEntity[]> {
    return this.userIdentityRepository.findByEmail(email.trim().toLowerCase());
  }

  async listActiveByEmail(email: string): Promise<UserIdentityEntity[]> {
    return this.userIdentityRepository.findActiveByEmail(email.trim().toLowerCase());
  }

  async listByTenant(tenantId: string): Promise<UserIdentityEntity[]> {
    await this.tenantService.getById(tenantId);
    return this.userIdentityRepository.findByTenant(tenantId);
  }

  async getContextPreference(normalizedEmail: string): Promise<UserContextPreferenceEntity | null> {
    return this.userContextPreferenceRepository.findByEmail(normalizedEmail.trim().toLowerCase());
  }

  async saveContextPreference(params: {
    normalizedEmail: string;
    lastTenantId: string | null;
    lastBranchId: string | null;
    actorUserId: string;
  }): Promise<UserContextPreferenceEntity> {
    const normalizedEmail = params.normalizedEmail.trim().toLowerCase();
    const existing = await this.userContextPreferenceRepository.findByEmail(normalizedEmail);
    const now = new Date();
    const preference = existing
      ? this.userContextPreferenceRepository.create({
          ...existing,
          lastTenantId: params.lastTenantId,
          lastBranchId: params.lastBranchId,
          updatedAt: now,
          updatedBy: params.actorUserId,
        })
      : this.userContextPreferenceRepository.create({
          normalizedEmail,
          lastTenantId: params.lastTenantId,
          lastBranchId: params.lastBranchId,
          createdAt: now,
          createdBy: params.actorUserId,
          updatedAt: now,
          updatedBy: params.actorUserId,
        });

    return this.userContextPreferenceRepository.save(preference);
  }

  private async assertTenantBranchConsistency(tenantId: string, defaultBranchId?: string) {
    await this.tenantService.getById(tenantId);
    if (defaultBranchId) {
      const branch = await this.branchService.getById(defaultBranchId);
      if (branch.tenantId !== tenantId) {
        throw new DomainValidationError('Default branch must belong to the same tenant as the user.');
      }
    }
  }
}
