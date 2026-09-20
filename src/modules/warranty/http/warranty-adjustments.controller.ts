import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { WarrantyAdjustmentStatus } from 'src/shared/domain/enums';
import { WarrantyService } from '../application/warranty/warranty.service';
import { SearchWarrantyAdjustmentsDto } from '../contracts/dto/search-warranty-adjustments.dto';

class CreateWarrantyAdjustmentBody {
  @IsUUID()
  serviceOrderId!: string;

  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsOptional()
  @IsUUID()
  customerRejectionId?: string;

  @IsString()
  adjustmentReason!: string;

  @IsDateString()
  actualDeliveryDate!: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  warrantyPeriodDays?: number;
}

class UpdateWarrantyAdjustmentBody {
  @IsOptional()
  @IsString()
  adjustmentReason?: string;

  @IsOptional()
  @IsEnum(WarrantyAdjustmentStatus)
  status?: WarrantyAdjustmentStatus;
}

@Controller('warranty-adjustments')
export class WarrantyAdjustmentsController {
  constructor(private readonly warrantyService: WarrantyService, private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('warranty.read')
  @Get()
  async list(@Query() query: SearchWarrantyAdjustmentsDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.serviceOrderId) {
      const order = await this.serviceOrderService.getById(query.serviceOrderId, tenantId);
      this.serviceOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    }
    return this.warrantyService.searchAdjustments(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('warranty.write')
  @Post()
  async create(@Body() body: CreateWarrantyAdjustmentBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(body.serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.warrantyService.createAdjustment({ ...(body as any), tenantId, actorUserId: principal.userId });
  }

  @Permissions('warranty.read')
  @Get(':warrantyAdjustmentId')
  async getById(@Param('warrantyAdjustmentId', new ParseUUIDPipe()) warrantyAdjustmentId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.warrantyService.getAdjustmentDetails(tenantId, warrantyAdjustmentId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('warranty.write')
  @Patch(':warrantyAdjustmentId')
  async update(@Param('warrantyAdjustmentId', new ParseUUIDPipe()) warrantyAdjustmentId: string, @Body() body: UpdateWarrantyAdjustmentBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.warrantyService.getAdjustmentDetails(tenantId, warrantyAdjustmentId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return this.warrantyService.updateAdjustment(warrantyAdjustmentId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }
}
