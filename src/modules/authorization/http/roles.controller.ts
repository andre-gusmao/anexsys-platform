import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { JwtAuthGuard } from 'src/platform/auth/jwt-auth.guard';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PermissionsGuard } from 'src/platform/auth/permissions.guard';
import { PlatformRequest } from 'src/platform/http/request-context';
import { AuthorizationService } from '../application/authorization/authorization.service';

class CreateRoleBody {
  @IsString()
  code!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystemManaged?: boolean;
}

class AssignPermissionBody {
  @IsUUID()
  permissionId!: string;
}

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Permissions('roles.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    return this.authorizationService.listRoles(tenantId);
  }

  @Permissions('roles.write')
  @Post()
  async create(
    @Body() body: CreateRoleBody,
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

    return this.authorizationService.createRole({ ...body, tenantId, actorUserId });
  }

  @Permissions('roles.read')
  @Get(':roleId')
  async getById(@Param('roleId') roleId: string) {
    return this.authorizationService.getRoleById(roleId);
  }

  @Permissions('roles.write')
  @Post(':roleId/permissions')
  async assignPermission(
    @Param('roleId') roleId: string,
    @Body() body: AssignPermissionBody,
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

    await this.authorizationService.assignPermissionToRole({
      tenantId,
      roleId,
      permissionId: body.permissionId,
      actorUserId,
    });

    return { success: true };
  }
}
