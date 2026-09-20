import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { BranchScopeType } from 'src/shared/domain/enums';
import { CurrentRequest, CurrentTenantId, CurrentUserId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { IdentityService } from '../application/identity/identity.service';

class CreateUserBody {
  @IsOptional()
  @IsUUID()
  defaultBranchId?: string;

  @IsEmail()
  email!: string;

  @IsString()
  displayName!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class AssignRoleBody {
  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsUUID()
  assignedBranchId?: string;
}

class AssignBranchScopeBody {
  @IsUUID()
  branchId!: string;

  @IsEnum(BranchScopeType)
  scopeType!: BranchScopeType;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Permissions('users.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    return this.identityService.listByTenant(tenantId);
  }

  @Permissions('users.write')
  @Post()
  async create(
    @Body() body: CreateUserBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.identityService.createUser({ ...body, tenantId, actorUserId });
  }

  @Permissions('users.read')
  @Get('me/effective-permissions')
  async getMyEffectivePermissions(@CurrentTenantId() tenantId: string | null, @CurrentUserId() userId: string | null) {
    if (!tenantId || !userId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.authorizationService.getEffectiveAccessForUser(tenantId, userId);
  }

  @Permissions('users.read')
  @Get(':userId')
  async getById(@Param('userId') userId: string, @CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    const user = await this.identityService.getById(userId);
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Requested user is outside the authenticated tenant scope.');
    }

    return user;
  }

  @Permissions('users.write')
  @Post(':userId/roles')
  async assignRole(
    @Param('userId') userId: string,
    @Body() body: AssignRoleBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    await this.authorizationService.assignRole({
      tenantId,
      userId,
      roleId: body.roleId,
      assignedBranchId: body.assignedBranchId,
      actorUserId,
    });

    return { success: true };
  }

  @Permissions('users.write')
  @Post(':userId/branch-scopes')
  async assignBranchScope(
    @Param('userId') userId: string,
    @Body() body: AssignBranchScopeBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    await this.authorizationService.assignBranchScope({
      tenantId,
      userId,
      branchId: body.branchId,
      scopeType: body.scopeType,
      actorUserId,
    });

    return { success: true };
  }
}
