import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { JwtAuthGuard } from 'src/platform/auth/jwt-auth.guard';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PermissionsGuard } from 'src/platform/auth/permissions.guard';
import { PlatformRequest } from 'src/platform/http/request-context';
import { AuthorizationService } from '../application/authorization/authorization.service';

class CreatePermissionBody {
  @IsString()
  code!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Permissions('permissions.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    return this.authorizationService.listPermissions(tenantId);
  }

  @Permissions('permissions.write')
  @Post()
  async create(
    @Body() body: CreatePermissionBody,
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

    return this.authorizationService.createPermission({ ...body, tenantId, actorUserId });
  }
}
