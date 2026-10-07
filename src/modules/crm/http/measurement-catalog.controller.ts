import {
  Inject,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { MeasurementCatalogService } from '../application/measurement-catalog/measurement-catalog.service';

class CreateMeasurementBodyPartBody {
  @IsString()
  displayName!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class PatchMeasurementBodyPartBody {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(MeasurementCatalogStatus)
  status?: MeasurementCatalogStatus;
}

class CreateMeasurementUnitBody {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class PatchMeasurementUnitBody {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(MeasurementCatalogStatus)
  status?: MeasurementCatalogStatus;
}

function requirePrincipal(tenantId: string | null, request: PlatformRequest) {
  const principal = request.requestContext.authenticatedPrincipal;
  if (!tenantId || !principal) {
    throw new UnauthorizedException('Authenticated tenant context is required.');
  }
  return principal;
}

function requireDependencyAction(action: string | undefined) {
  if (action && action !== 'inactivate' && action !== 'delete') {
    throw new BadRequestException(`Unsupported dependency validation action '${action}'.`);
  }
  return action === 'delete' ? 'delete' : 'inactivate';
}

@Controller('measurement-catalog')
export class MeasurementCatalogController {
  constructor(
    @Inject(MeasurementCatalogService)
    private readonly measurementCatalogService: MeasurementCatalogService,
  ) {}

  @Permissions('measurements.read')
  @Get()
  async getCatalog(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = requirePrincipal(tenantId, request);
    return this.measurementCatalogService.getCatalog(tenantId as string, principal.userId);
  }
}

@Controller('measurement-body-parts')
export class MeasurementBodyPartsController {
  constructor(
    @Inject(MeasurementCatalogService)
    private readonly measurementCatalogService: MeasurementCatalogService,
    @Inject(DependencyValidationService)
    private readonly dependencyValidationService: DependencyValidationService,
  ) {}

  @Permissions('measurements.read')
  @Get()
  async listBodyParts(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = requirePrincipal(tenantId, request);
    return this.measurementCatalogService.listBodyParts(tenantId as string, principal.userId);
  }

  @Permissions('measurements.write')
  @Get(':bodyPartId/dependency-check')
  async dependencyCheck(
    @Param('bodyPartId', new ParseUUIDPipe()) bodyPartId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
    @Query('action') action: string | undefined,
  ) {
    requirePrincipal(tenantId, request);
    const resolvedAction = requireDependencyAction(action);
    return resolvedAction === 'delete'
      ? this.dependencyValidationService.validateBodyPartDeletion(tenantId as string, bodyPartId)
      : this.dependencyValidationService.validateBodyPartInactivation(tenantId as string, bodyPartId);
  }

  @Permissions('measurements.write')
  @Post()
  async createBodyPart(
    @Body() body: CreateMeasurementBodyPartBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    if (!body.displayName.trim()) {
      throw new BadRequestException('O nome da parte do corpo é obrigatório.');
    }

    return this.measurementCatalogService.createBodyPart({
      tenantId: tenantId as string,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }

  @Permissions('measurements.write')
  @Patch(':bodyPartId')
  async updateBodyPart(
    @Param('bodyPartId', new ParseUUIDPipe()) bodyPartId: string,
    @Body() body: PatchMeasurementBodyPartBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    return this.measurementCatalogService.updateBodyPart(bodyPartId, {
      tenantId: tenantId as string,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      status: body.status,
      actorUserId: principal.userId,
    });
  }

  @Permissions('measurements.write')
  @Delete(':bodyPartId')
  async removeBodyPart(
    @Param('bodyPartId', new ParseUUIDPipe()) bodyPartId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    await this.measurementCatalogService.removeBodyPart(bodyPartId, tenantId as string, principal.userId);
    return { id: bodyPartId, deleted: true };
  }
}

@Controller('measurement-units')
export class MeasurementUnitsController {
  constructor(
    @Inject(MeasurementCatalogService)
    private readonly measurementCatalogService: MeasurementCatalogService,
    @Inject(DependencyValidationService)
    private readonly dependencyValidationService: DependencyValidationService,
  ) {}

  @Permissions('measurements.read')
  @Get()
  async listUnits(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = requirePrincipal(tenantId, request);
    return this.measurementCatalogService.listUnits(tenantId as string, principal.userId);
  }

  @Permissions('measurements.write')
  @Get(':unitId/dependency-check')
  async dependencyCheck(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
    @Query('action') action: string | undefined,
  ) {
    requirePrincipal(tenantId, request);
    const resolvedAction = requireDependencyAction(action);
    return resolvedAction === 'delete'
      ? this.dependencyValidationService.validateMeasurementUnitDeletion(tenantId as string, unitId)
      : this.dependencyValidationService.validateMeasurementUnitInactivation(tenantId as string, unitId);
  }

  @Permissions('measurements.write')
  @Post()
  async createUnit(
    @Body() body: CreateMeasurementUnitBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    if (!body.code.trim()) {
      throw new BadRequestException('O código da unidade de medida é obrigatório.');
    }

    return this.measurementCatalogService.createUnit({
      tenantId: tenantId as string,
      code: body.code,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }

  @Permissions('measurements.write')
  @Patch(':unitId')
  async updateUnit(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() body: PatchMeasurementUnitBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    return this.measurementCatalogService.updateUnit(unitId, {
      tenantId: tenantId as string,
      code: body.code,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      status: body.status,
      actorUserId: principal.userId,
    });
  }

  @Permissions('measurements.write')
  @Delete(':unitId')
  async removeUnit(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    await this.measurementCatalogService.removeUnit(unitId, tenantId as string, principal.userId);
    return { id: unitId, deleted: true };
  }
}
