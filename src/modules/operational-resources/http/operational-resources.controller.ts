import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';
import { CreateOperationalResourceDto } from '../contracts/dto/create-operational-resource.dto';
import { SearchOperationalResourcesDto } from '../contracts/dto/search-operational-resources.dto';
import { UpdateOperationalResourceAvailabilityDto } from '../contracts/dto/update-operational-resource-availability.dto';
import { UpdateOperationalResourceDto } from '../contracts/dto/update-operational-resource.dto';
import { OperationalResourceService } from '../application/operational-resource/operational-resource.service';

class CreateOperationalResourceBody {
  @IsOptional()
  @IsUUID()
  homeBranchId?: string;

  @IsEnum(OperationalResourceType)
  resourceType!: OperationalResourceType;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  qualificationNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchScopeBranchIds?: string[];

  @IsOptional()
  @IsEnum(OperationalAvailabilityStatus)
  availabilityStatus?: OperationalAvailabilityStatus;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsString()
  availableUntil?: string;

  @IsOptional()
  @IsString()
  availabilityNotes?: string;
}

class UpdateOperationalResourceBody {
  @IsOptional()
  @IsUUID()
  homeBranchId?: string;

  @IsOptional()
  @IsEnum(OperationalResourceType)
  resourceType?: OperationalResourceType;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  qualificationNotes?: string;

  @IsOptional()
  @IsEnum(OperationalResourceStatus)
  status?: OperationalResourceStatus;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchScopeBranchIds?: string[];

  @IsOptional()
  @IsEnum(OperationalAvailabilityStatus)
  availabilityStatus?: OperationalAvailabilityStatus;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsString()
  availableUntil?: string;

  @IsOptional()
  @IsString()
  availabilityNotes?: string;
}

class AddSkillsBody {
  @IsArray()
  @IsString({ each: true })
  skills!: string[];
}

class UpdateAvailabilityBody {
  @IsEnum(OperationalAvailabilityStatus)
  availabilityStatus!: OperationalAvailabilityStatus;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsString()
  availableUntil?: string;

  @IsOptional()
  @IsString()
  availabilityNotes?: string;
}

@Controller('operational-resources')
export class OperationalResourcesController {
  constructor(private readonly operationalResourceService: OperationalResourceService) {}

  @Permissions('operational_resources.read')
  @Get()
  async list(
    @Query() query: SearchOperationalResourcesDto,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }

    return this.operationalResourceService.search(tenantId, {
      ...query,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }

  @Permissions('operational_resources.write')
  @Post()
  async create(
    @Body() body: CreateOperationalResourceBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    this.assertBranchIdsInsideScope([body.homeBranchId, ...(body.branchScopeBranchIds ?? [])], principal.effectiveBranchIds);

    return this.operationalResourceService.create({
      ...(body as CreateOperationalResourceDto),
      tenantId,
      actorUserId: principal.userId,
    });
  }

  @Permissions('operational_resources.read')
  @Get(':resourceId')
  async getById(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    return this.getScopedResourceDetails(resourceId, tenantId, request);
  }

  @Permissions('operational_resources.write')
  @Patch(':resourceId')
  async update(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @Body() body: UpdateOperationalResourceBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedResourceDetails(resourceId, tenantId, request);
    this.assertBranchIdsInsideScope([body.homeBranchId, ...(body.branchScopeBranchIds ?? [])], principal.effectiveBranchIds);

    return this.operationalResourceService.update(resourceId, tenantId, {
      ...(body as UpdateOperationalResourceDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('operational_resources.read')
  @Get(':resourceId/skills')
  async getSkills(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const details = await this.getScopedResourceDetails(resourceId, tenantId, request);
    return { resourceId, skills: details.resource.skillProfile ?? [] };
  }

  @Permissions('operational_resources.write')
  @Post(':resourceId/skills')
  async addSkills(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @Body() body: AddSkillsBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedResourceDetails(resourceId, tenantId, request);
    return this.operationalResourceService.addSkills(resourceId, tenantId, body.skills, principal.userId);
  }

  @Permissions('operational_resources.read')
  @Get(':resourceId/availability')
  async getAvailability(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const details = await this.getScopedResourceDetails(resourceId, tenantId, request);
    return {
      resourceId,
      availabilityStatus: details.resource.availabilityStatus,
      availableFrom: details.resource.availableFrom,
      availableUntil: details.resource.availableUntil,
      availabilityNotes: details.resource.availabilityNotes,
    };
  }

  @Permissions('operational_resources.write')
  @Patch(':resourceId/availability')
  async updateAvailability(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @Body() body: UpdateAvailabilityBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedResourceDetails(resourceId, tenantId, request);
    return this.operationalResourceService.updateAvailability(resourceId, tenantId, {
      ...(body as UpdateOperationalResourceAvailabilityDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('operational_resources.read')
  @Get(':resourceId/assignments')
  async listAssignments(
    @Param('resourceId', new ParseUUIDPipe()) resourceId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedResourceDetails(resourceId, tenantId, request);
    return this.operationalResourceService.listAssignments(tenantId!, resourceId);
  }

  private async getScopedResourceDetails(resourceId: string, tenantId: string | null, request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.operationalResourceService.assertResourceBranchAccess(resourceId, tenantId, principal.effectiveBranchIds);
    return this.operationalResourceService.getDetails(tenantId, resourceId);
  }

  private assertBranchIdsInsideScope(branchIds: Array<string | undefined>, accessibleBranchIds: string[]) {
    for (const branchId of branchIds.filter((value): value is string => Boolean(value))) {
      if (!accessibleBranchIds.includes(branchId)) {
        throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
      }
    }
  }
}
