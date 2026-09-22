import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { MeasurementCatalogService } from '../application/measurement-catalog/measurement-catalog.service';

class UpsertMeasurementBodyPartBody {
  @IsString()
  displayName!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class UpsertMeasurementUnitBody {
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

@Controller('measurement-catalog')
export class MeasurementCatalogController {
  constructor(private readonly measurementCatalogService: MeasurementCatalogService) {}

  @Permissions('measurements.read')
  @Get()
  async getCatalog(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    return this.measurementCatalogService.getCatalog(tenantId, principal.userId);
  }
}

@Controller('measurement-body-parts')
export class MeasurementBodyPartsController {
  constructor(private readonly measurementCatalogService: MeasurementCatalogService) {}

  @Permissions('measurements.read')
  @Get()
  async listBodyParts(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    return this.measurementCatalogService.listBodyParts(tenantId, principal.userId);
  }

  @Permissions('measurements.write')
  @Post()
  async createBodyPart(
    @Body() body: UpsertMeasurementBodyPartBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (!body.displayName.trim()) {
      throw new BadRequestException('Body part display name is required.');
    }

    return this.measurementCatalogService.createBodyPart({
      tenantId,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }

  @Permissions('measurements.write')
  @Patch(':bodyPartId')
  async updateBodyPart(
    @Param('bodyPartId', new ParseUUIDPipe()) bodyPartId: string,
    @Body() body: UpsertMeasurementBodyPartBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    return this.measurementCatalogService.updateBodyPart(bodyPartId, {
      tenantId,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }
}

@Controller('measurement-units')
export class MeasurementUnitsController {
  constructor(private readonly measurementCatalogService: MeasurementCatalogService) {}

  @Permissions('measurements.read')
  @Get()
  async listUnits(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    return this.measurementCatalogService.listUnits(tenantId, principal.userId);
  }

  @Permissions('measurements.write')
  @Post()
  async createUnit(
    @Body() body: UpsertMeasurementUnitBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (!body.code.trim()) {
      throw new BadRequestException('Measurement unit code is required.');
    }

    return this.measurementCatalogService.createUnit({
      tenantId,
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
    @Body() body: UpsertMeasurementUnitBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    return this.measurementCatalogService.updateUnit(unitId, {
      tenantId,
      code: body.code,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }
}
