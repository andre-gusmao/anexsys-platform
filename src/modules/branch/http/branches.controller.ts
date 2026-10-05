import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { BranchHoursService } from 'src/modules/company/application/company/branch-hours.service';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';
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

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
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

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

class OperatingHoursDayBody {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsBoolean()
  isOpen!: boolean;

  @IsOptional()
  @IsString()
  opensAt?: string | null;

  @IsOptional()
  @IsString()
  closesAt?: string | null;

  @IsOptional()
  @IsString()
  cutoffAt?: string | null;
}

class ReplaceOperatingHoursBody {
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDayBody)
  days!: OperatingHoursDayBody[];

  @IsOptional()
  @IsString()
  timezone?: string;
}

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchService: BranchService,
    private readonly dependencyValidationService: DependencyValidationService,
    private readonly branchHoursService: BranchHoursService,
  ) {}

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
  @Get(':branchId/dependency-check')
  async dependencyCheck(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
    @Query('action') action: string | undefined,
  ) {
    await this.getScopedBranch(branchId, tenantId, request);
    if (action && action !== 'deactivate') {
      throw new BadRequestException(`Unsupported dependency validation action '${action}'.`);
    }

    return this.dependencyValidationService.validateBranchDeactivation(branchId);
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
  @Get(':branchId/operating-hours')
  async getOperatingHours(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedBranch(branchId, tenantId, request);
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    return this.branchHoursService.list(tenantId, branchId);
  }

  @Permissions('branches.write')
  @Put(':branchId/operating-hours')
  async replaceOperatingHours(
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Body() body: ReplaceOperatingHoursBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    await this.getScopedBranch(branchId, tenantId, request);
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
    const days = await this.branchHoursService.replaceHours(
      tenantId,
      branchId,
      body.days,
      actorUserId,
      body.timezone,
    );
    return { timezone: body.timezone, days };
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
