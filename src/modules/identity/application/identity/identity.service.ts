import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { PasswordHasherService } from 'src/platform/auth/password-hasher.service';
import { UserStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CreateUserDto } from '../../contracts/dto/create-user.dto';
import { UserCredentialRepository } from '../../infrastructure/persistence/repositories/user-credential.repository';
import { UserIdentityEntity } from '../../infrastructure/persistence/entities/user-identity.entity';
import { UserIdentityRepository } from '../../infrastructure/persistence/repositories/user-identity.repository';

@Injectable()
export class IdentityService {
  constructor(
    private readonly userIdentityRepository: UserIdentityRepository,
    private readonly userCredentialRepository: UserCredentialRepository,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly auditService: AuditService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserIdentityEntity> {
    await this.tenantService.getById(dto.tenantId);
    if (dto.defaultBranchId) {
      const branch = await this.branchService.getById(dto.defaultBranchId);
      if (branch.tenantId !== dto.tenantId) {
        throw new DomainValidationError('Default branch must belong to the same tenant as the user.');
      }
    }

    const existing = await this.userIdentityRepository.findByTenantAndEmail(dto.tenantId, dto.email);
    if (existing) {
      throw new DomainValidationError(`User email '${dto.email}' already exists for this tenant.`);
    }

    const userId = randomUUID();
    const user = this.userIdentityRepository.create({
      id: userId,
      tenantId: dto.tenantId,
      defaultBranchId: dto.defaultBranchId ?? null,
      email: dto.email.trim().toLowerCase(),
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

    const savedUser = await this.userIdentityRepository.save(user);
    await this.userCredentialRepository.save(credential);
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
}
