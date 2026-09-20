import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { JwtAuthGuard } from 'src/platform/auth/jwt-auth.guard';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PermissionsGuard } from 'src/platform/auth/permissions.guard';
import { PlatformRequest } from 'src/platform/http/request-context';
import { BranchService } from '../application/branch/branch.service';

class CreateBranchBody {
  @IsString()
  @Length(2, 50)
  code!: string;

  @IsString()
  legalName!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsUUID()
  parentBranchId?: string;

  @IsOptional()
  @IsString()
  businessCalendarName?: string;
}

class UpdateBranchBody {
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

  @IsOptional()
  @IsUUID()
  parentBranchId?: string | null;

  @IsOptional()
  @IsString()
  businessCalendarName?: string;
}

@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchService: BranchService) {}

  @Permissions('branches.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    return this.branchService.listByTenant(tenantId);
  }

  @Permissions('branches.write')
  @Post()
  async create(
    @Body() body: CreateBranchBody,
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

    return this.branchService.create({ ...body, tenantId, actorUserId });
  }

  @Permissions('branches.read')
  @Get(':branchId')
  async getById(@Param('branchId') branchId: string) {
    return this.branchService.getById(branchId);
  }

  @Permissions('branches.write')
  @Patch(':branchId')
  async update(
    @Param('branchId') branchId: string,
    @Body() body: UpdateBranchBody,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.branchService.update(branchId, { ...body, actorUserId });
  }

  @Permissions('branches.write')
  @Post(':branchId/activate')
  async activate(@Param('branchId') branchId: string, @CurrentRequest() request: PlatformRequest) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.branchService.activate(branchId, actorUserId);
  }

  @Permissions('branches.write')
  @Post(':branchId/deactivate')
  async deactivate(@Param('branchId') branchId: string, @CurrentRequest() request: PlatformRequest) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.branchService.deactivate(branchId, actorUserId);
  }

  @Permissions('branches.read')
  @Get(':branchId/children')
  async listChildren(@Param('branchId') branchId: string) {
    return this.branchService.listChildren(branchId);
  }
}
