import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { StorageLocationStatus } from 'src/shared/domain/enums';
import { SearchStorageLocationsDto } from '../contracts/dto/search-storage-locations.dto';
import { CustodyService } from '../application/custody/custody.service';

class SearchStorageLocationsQuery implements SearchStorageLocationsDto {
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsEnum(StorageLocationStatus) status?: StorageLocationStatus;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() corridor?: string;
  @IsOptional() @IsString() rowCode?: string;
  @IsOptional() @IsString() shelfCode?: string;
  @IsOptional() @IsString() cabinetCode?: string;
  @IsOptional() @IsString() drawerCode?: string;
  accessibleBranchIds!: string[];
}

class StorageLocationBody {
  @IsUUID() branchId!: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() corridor?: string;
  @IsOptional() @IsString() rowCode?: string;
  @IsOptional() @IsString() shelfCode?: string;
  @IsOptional() @IsString() cabinetCode?: string;
  @IsOptional() @IsString() drawerCode?: string;
  @IsOptional() @IsString() displayLabel?: string;
  @IsOptional() @IsEnum(StorageLocationStatus) status?: StorageLocationStatus;
}

class UpdateStorageLocationBody {
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() corridor?: string;
  @IsOptional() @IsString() rowCode?: string;
  @IsOptional() @IsString() shelfCode?: string;
  @IsOptional() @IsString() cabinetCode?: string;
  @IsOptional() @IsString() drawerCode?: string;
  @IsOptional() @IsString() displayLabel?: string;
  @IsOptional() @IsEnum(StorageLocationStatus) status?: StorageLocationStatus;
}

class AssignLocationBody {
  @IsUUID() storageLocationId!: string;
  @IsOptional() @IsDateString() assignedAt?: string;
  @IsOptional() @IsString() assignmentReason?: string;
  @IsOptional() @IsUUID() productionOrderId?: string;
  @IsOptional() @IsString() bagLabel?: string;
  @IsOptional() @IsString() bagNotes?: string;
  @Type(() => Boolean) @IsOptional() @IsBoolean() bagInUse?: boolean;
}

@Controller()
export class StorageLocationsController {
  constructor(private readonly custodyService: CustodyService, private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('custody.read')
  @Get('storage-locations')
  async list(@Query() query: SearchStorageLocationsQuery, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return this.custodyService.searchStorageLocations(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('custody.write')
  @Post('storage-locations')
  async create(@Body() body: StorageLocationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (!principal.effectiveBranchIds.includes(body.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return this.custodyService.createStorageLocation({ ...body, tenantId, actorUserId: principal.userId });
  }

  @Permissions('custody.read')
  @Get('storage-locations/:locationId')
  async getById(@Param('locationId', new ParseUUIDPipe()) locationId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const location = await this.custodyService.getStorageLocationById(locationId, tenantId);
    if (!principal.effectiveBranchIds.includes(location.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return location;
  }

  @Permissions('custody.write')
  @Patch('storage-locations/:locationId')
  async update(@Param('locationId', new ParseUUIDPipe()) locationId: string, @Body() body: UpdateStorageLocationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const location = await this.custodyService.getStorageLocationById(locationId, tenantId);
    if (!principal.effectiveBranchIds.includes(location.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return this.custodyService.updateStorageLocation(locationId, { ...body, tenantId, actorUserId: principal.userId });
  }

  @Permissions('custody.read')
  @Get('service-orders/:serviceOrderId/location')
  async currentLocation(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.custodyService.getServiceOrderLocation(tenantId, serviceOrderId);
  }

  @Permissions('custody.write')
  @Post('service-orders/:serviceOrderId/location-assignments')
  async assign(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @Body() body: AssignLocationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.custodyService.assignStorageLocation({ ...body, tenantId, actorUserId: principal.userId, serviceOrderId });
  }

  @Permissions('custody.read')
  @Get('service-orders/:serviceOrderId/location-history')
  async history(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.custodyService.listServiceOrderLocationHistory(tenantId, serviceOrderId);
  }
}
