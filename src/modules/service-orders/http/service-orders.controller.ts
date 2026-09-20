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
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { DeliveryType, ServiceOrderItemStatus, SurchargeMethod } from 'src/shared/domain/enums';
import { SearchServiceOrdersDto } from '../contracts/dto/search-service-orders.dto';
import { ServiceOrderService } from '../application/service-order/service-order.service';

class CreateServiceOrderItemBody {
  @IsString()
  itemType!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;
}

class CreateServiceOrderBody {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  commercialResponsibleActorId?: string;

  @IsOptional()
  @IsUUID()
  technicalMeasurementResponsibleActorId?: string;

  @IsOptional()
  @IsDateString()
  deliveryCommitmentSourceAt?: string;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsOptional()
  @IsEnum(SurchargeMethod)
  deliverySurchargeMethod?: SurchargeMethod;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliverySurchargeValue?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  commercialNotes?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOrderItemBody)
  items!: CreateServiceOrderItemBody[];
}

class UpdateServiceOrderBody {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  commercialResponsibleActorId?: string;

  @IsOptional()
  @IsUUID()
  technicalMeasurementResponsibleActorId?: string;

  @IsOptional()
  @IsDateString()
  deliveryCommitmentSourceAt?: string;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsOptional()
  @IsEnum(SurchargeMethod)
  deliverySurchargeMethod?: SurchargeMethod;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliverySurchargeValue?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  commercialNotes?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;
}

class UpdateServiceOrderItemBody {
  @IsOptional()
  @IsString()
  itemType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsOptional()
  @IsEnum(ServiceOrderItemStatus)
  status?: ServiceOrderItemStatus;
}

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('service_orders.read')
  @Get()
  async list(
    @Query() query: SearchServiceOrdersDto,
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

    return this.serviceOrderService.search(tenantId, {
      ...query,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }

  @Permissions('service_orders.write')
  @Post()
  async create(
    @Body() body: CreateServiceOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (!principal.effectiveBranchIds.includes(body.branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }

    return this.serviceOrderService.create({
      ...body,
      tenantId,
      actorUserId: principal.userId,
    });
  }

  @Permissions('service_orders.read')
  @Get(':serviceOrderId')
  async getById(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.getDetails(tenantId, serviceOrderId);
  }

  @Permissions('service_orders.write')
  @Patch(':serviceOrderId')
  async update(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @Body() body: UpdateServiceOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.update(serviceOrderId, tenantId, { ...body, actorUserId: principal.userId });
  }

  @Permissions('service_orders.write')
  @Post(':serviceOrderId/items')
  async createItem(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @Body() body: CreateServiceOrderItemBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.addItem({
      ...body,
      tenantId,
      branchId: serviceOrder.branchId,
      serviceOrderId,
      actorUserId: principal.userId,
    });
  }

  @Permissions('service_orders.write')
  @Patch(':serviceOrderId/items/:itemId')
  async updateItem(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() body: UpdateServiceOrderItemBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.updateItem(serviceOrderId, itemId, tenantId, { ...body, actorUserId: principal.userId });
  }

  @Permissions('service_orders.write')
  @Post(':serviceOrderId/approve')
  async approve(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.approve(serviceOrderId, tenantId, principal.userId);
  }

  @Permissions('service_orders.write')
  @Post(':serviceOrderId/cancel')
  async cancel(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.cancel(serviceOrderId, tenantId, principal.userId);
  }

  @Permissions('service_orders.write')
  @Post(':serviceOrderId/delivery-date/recalculate')
  async recalculateDeliveryDate(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.recalculateDeliveryDate(serviceOrderId, tenantId, principal.userId);
  }

  @Permissions('service_orders.read')
  @Get(':serviceOrderId/timeline')
  async timeline(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.serviceOrderService.getTimeline(serviceOrderId, tenantId);
  }
}
