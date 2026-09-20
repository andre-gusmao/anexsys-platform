import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, Length, ValidateIf } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
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
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentBranchId?: string | null;

  @IsOptional()
  @IsString()
  businessCalendarName?: string;
}

@Controller('branches')
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
  async getById(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    return this.getScopedBranch(branchId, tenantId, request);
  }

  @Permissions('branches.write')
  @Patch(':branchId')
  async update(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Body() body: UpdateBranchBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    await this.getScopedBranch(branchId, tenantId, request);
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.branchService.update(branchId, { ...body, actorUserId });
  }

  @Permissions('branches.write')
  @Post(':branchId/activate')
  async activate(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    await this.getScopedBranch(branchId, tenantId, request);
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.branchService.activate(branchId, actorUserId);
  }

  @Permissions('branches.write')
  @Post(':branchId/deactivate')
  async deactivate(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    await this.getScopedBranch(branchId, tenantId, request);
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.branchService.deactivate(branchId, actorUserId);
  }

  @Permissions('branches.read')
  @Get(':branchId/children')
  async listChildren(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedBranch(branchId, tenantId, request);
    return this.branchService.listChildren(branchId);
  }

  private async getScopedBranch(branchId: string, tenantId: string | null, request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    const effectiveBranchIds = principal?.effectiveBranchIds ?? [];
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!principal) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    const branch = await this.branchService.getById(branchId);
    if (branch.tenantId !== tenantId) {
      throw new ForbiddenException('Requested branch is outside the authenticated tenant scope.');
    }
    if (!effectiveBranchIds.includes(branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }

    return branch;
  }
}
