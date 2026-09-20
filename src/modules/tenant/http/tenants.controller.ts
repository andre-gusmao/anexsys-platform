import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { TenantService } from '../application/tenant/tenant.service';

class CreateTenantBody {
  @IsString()
  @Length(2, 50)
  code!: string;

  @IsString()
  legalName!: string;

  @IsString()
  displayName!: string;
}

class UpdateTenantBody {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  code?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantService: TenantService) {}

  @Permissions('tenants.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    return [await this.tenantService.getById(tenantId)];
  }

  @Permissions('tenants.write')
  @Post()
  async create(@Body() body: CreateTenantBody, @CurrentRequest() request: PlatformRequest) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.tenantService.create({ ...body, actorUserId });
  }

  @Permissions('tenants.read')
  @Get(':tenantId')
  async getById(@Param('tenantId') tenantId: string, @CurrentTenantId() currentTenantId: string | null) {
    this.assertTenantScope(tenantId, currentTenantId);
    return this.tenantService.getById(tenantId);
  }

  @Permissions('tenants.write')
  @Patch(':tenantId')
  async update(
    @Param('tenantId') tenantId: string,
    @Body() body: UpdateTenantBody,
    @CurrentTenantId() currentTenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    this.assertTenantScope(tenantId, currentTenantId);
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.tenantService.update(tenantId, { ...body, actorUserId });
  }

  @Permissions('tenants.write')
  @Post(':tenantId/activate')
  async activate(
    @Param('tenantId') tenantId: string,
    @CurrentTenantId() currentTenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    this.assertTenantScope(tenantId, currentTenantId);
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.tenantService.activate(tenantId, actorUserId);
  }

  @Permissions('tenants.write')
  @Post(':tenantId/deactivate')
  async deactivate(
    @Param('tenantId') tenantId: string,
    @CurrentTenantId() currentTenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    this.assertTenantScope(tenantId, currentTenantId);
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.tenantService.deactivate(tenantId, actorUserId);
  }

  private assertTenantScope(requestedTenantId: string, currentTenantId: string | null): void {
    if (!currentTenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (requestedTenantId !== currentTenantId) {
      throw new ForbiddenException('Requested tenant is outside the authenticated tenant scope.');
    }
  }
}
