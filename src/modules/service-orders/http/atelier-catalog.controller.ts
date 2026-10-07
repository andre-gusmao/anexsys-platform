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
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { AtelierCatalogService } from '../application/atelier-catalog/atelier-catalog.service';

class CreateCatalogNameBody {
  @IsString()
  displayName!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class PatchCatalogNameBody {
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

class CreateAtelierServiceBody extends CreateCatalogNameBody {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultPrice?: number;
}

class PatchAtelierServiceBody extends PatchCatalogNameBody {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultPrice?: number | null;
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

@Controller('garment-products')
export class GarmentProductsController {
  constructor(
    @Inject(AtelierCatalogService)
    private readonly atelierCatalogService: AtelierCatalogService,
    @Inject(DependencyValidationService)
    private readonly dependencyValidationService: DependencyValidationService,
  ) {}

  @Permissions('service_orders.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = requirePrincipal(tenantId, request);
    return this.atelierCatalogService.listProducts(tenantId as string, principal.userId);
  }

  @Permissions('service_orders.write')
  @Get(':productId/dependency-check')
  async dependencyCheck(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
    @Query('action') action: string | undefined,
  ) {
    requirePrincipal(tenantId, request);
    return requireDependencyAction(action) === 'delete'
      ? this.dependencyValidationService.validateGarmentProductDeletion(tenantId as string, productId)
      : this.dependencyValidationService.validateGarmentProductInactivation(tenantId as string, productId);
  }

  @Permissions('service_orders.write')
  @Post()
  async create(
    @Body() body: CreateCatalogNameBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    if (!body.displayName.trim()) {
      throw new BadRequestException('O nome do produto é obrigatório.');
    }
    return this.atelierCatalogService.createProduct({
      tenantId: tenantId as string,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }

  @Permissions('service_orders.write')
  @Patch(':productId')
  async update(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() body: PatchCatalogNameBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    return this.atelierCatalogService.updateProduct(productId, {
      tenantId: tenantId as string,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      status: body.status,
      actorUserId: principal.userId,
    });
  }

  @Permissions('service_orders.write')
  @Delete(':productId')
  async remove(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    await this.atelierCatalogService.removeProduct(productId, tenantId as string, principal.userId);
    return { id: productId, deleted: true };
  }
}

@Controller('atelier-services')
export class AtelierServicesController {
  constructor(
    @Inject(AtelierCatalogService)
    private readonly atelierCatalogService: AtelierCatalogService,
    @Inject(DependencyValidationService)
    private readonly dependencyValidationService: DependencyValidationService,
  ) {}

  @Permissions('service_orders.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = requirePrincipal(tenantId, request);
    return this.atelierCatalogService.listServices(tenantId as string, principal.userId);
  }

  @Permissions('service_orders.write')
  @Get(':serviceId/dependency-check')
  async dependencyCheck(
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
    @Query('action') action: string | undefined,
  ) {
    requirePrincipal(tenantId, request);
    return requireDependencyAction(action) === 'delete'
      ? this.dependencyValidationService.validateAtelierServiceDeletion(tenantId as string, serviceId)
      : this.dependencyValidationService.validateAtelierServiceInactivation(tenantId as string, serviceId);
  }

  @Permissions('service_orders.write')
  @Post()
  async create(
    @Body() body: CreateAtelierServiceBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    if (!body.displayName.trim()) {
      throw new BadRequestException('O nome do serviço é obrigatório.');
    }
    return this.atelierCatalogService.createService({
      tenantId: tenantId as string,
      displayName: body.displayName,
      defaultPrice: body.defaultPrice,
      sortOrder: body.sortOrder,
      actorUserId: principal.userId,
    });
  }

  @Permissions('service_orders.write')
  @Patch(':serviceId')
  async update(
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @Body() body: PatchAtelierServiceBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    return this.atelierCatalogService.updateService(serviceId, {
      tenantId: tenantId as string,
      displayName: body.displayName,
      defaultPrice: body.defaultPrice,
      sortOrder: body.sortOrder,
      status: body.status,
      actorUserId: principal.userId,
    });
  }

  @Permissions('service_orders.write')
  @Delete(':serviceId')
  async remove(
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = requirePrincipal(tenantId, request);
    await this.atelierCatalogService.removeService(serviceId, tenantId as string, principal.userId);
    return { id: serviceId, deleted: true };
  }
}
