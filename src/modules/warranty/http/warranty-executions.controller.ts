import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { WarrantyExecutionStatus } from 'src/shared/domain/enums';
import { WarrantyService } from '../application/warranty/warranty.service';
import { SearchWarrantyExecutionsDto } from '../contracts/dto/search-warranty-executions.dto';

class CreateWarrantyExecutionBody {
  @IsUUID()
  serviceOrderId!: string;

  @IsUUID()
  productionOrderId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  affectedServiceOrderItemIds!: string[];

  @IsString()
  executionReason!: string;

  @IsOptional()
  @IsUUID()
  correctiveOperationalResourceId?: string;

  @IsOptional()
  @IsUUID()
  customerRejectionId?: string;

  @IsOptional()
  @IsUUID()
  qualityRecordId?: string;
}

class UpdateWarrantyExecutionBody {
  @IsOptional()
  @IsString()
  executionReason?: string;

  @IsOptional()
  @IsUUID()
  correctiveOperationalResourceId?: string;

  @IsOptional()
  @IsEnum(WarrantyExecutionStatus)
  status?: WarrantyExecutionStatus;
}

class ResolveWarrantyExecutionBody {
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

@Controller('warranty-executions')
export class WarrantyExecutionsController {
  constructor(private readonly warrantyService: WarrantyService, private readonly productionOrderService: ProductionOrderService) {}

  @Permissions('warranty.read')
  @Get()
  async list(@Query() query: SearchWarrantyExecutionsDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.productionOrderId) {
      const order = await this.productionOrderService.getById(query.productionOrderId, tenantId);
      this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    }
    return this.warrantyService.searchExecutions(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('warranty.write')
  @Post()
  async create(@Body() body: CreateWarrantyExecutionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const order = await this.productionOrderService.getById(body.productionOrderId, tenantId);
    this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    return this.warrantyService.createExecution({ ...(body as any), tenantId, actorUserId: principal.userId });
  }

  @Permissions('warranty.read')
  @Get(':warrantyExecutionId')
  async getById(@Param('warrantyExecutionId', new ParseUUIDPipe()) warrantyExecutionId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.warrantyService.getExecutionDetails(tenantId, warrantyExecutionId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('warranty.write')
  @Patch(':warrantyExecutionId')
  async update(@Param('warrantyExecutionId', new ParseUUIDPipe()) warrantyExecutionId: string, @Body() body: UpdateWarrantyExecutionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.warrantyService.getExecutionDetails(tenantId, warrantyExecutionId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.warrantyService.updateExecution(warrantyExecutionId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('warranty.write')
  @Post(':warrantyExecutionId/resolve')
  async resolve(@Param('warrantyExecutionId', new ParseUUIDPipe()) warrantyExecutionId: string, @Body() body: ResolveWarrantyExecutionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.warrantyService.getExecutionDetails(tenantId, warrantyExecutionId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.warrantyService.resolveExecution(warrantyExecutionId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }
}
