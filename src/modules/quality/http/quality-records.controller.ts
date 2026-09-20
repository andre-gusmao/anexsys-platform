import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { DefectSeverity, QualityInspectionResult, QualityInspectionType } from 'src/shared/domain/enums';
import { QualityService } from '../application/quality/quality.service';
import { SearchQualityRecordsDto } from '../contracts/dto/search-quality-records.dto';

class QualityDefectBody {
  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsEnum(DefectSeverity)
  severity!: DefectSeverity;
}

class CreateQualityRecordBody {
  @IsUUID()
  productionOrderId!: string;

  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsEnum(QualityInspectionType)
  inspectionType!: QualityInspectionType;

  @IsOptional()
  @IsDateString()
  inspectionAt?: string;

  @IsOptional()
  @IsArray()
  defects?: QualityDefectBody[];

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateQualityRecordBody {
  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsOptional()
  @IsEnum(QualityInspectionType)
  inspectionType?: QualityInspectionType;

  @IsOptional()
  @IsEnum(QualityInspectionResult)
  inspectionResult?: QualityInspectionResult;

  @IsOptional()
  @IsDateString()
  inspectionAt?: string;

  @IsOptional()
  @IsArray()
  defects?: QualityDefectBody[];

  @IsOptional()
  @IsString()
  notes?: string;
}

class QualityDecisionBody {
  @IsOptional()
  @IsString()
  notes?: string;
}

class RequestReworkBody {
  @IsString()
  reworkReason!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  affectedServiceOrderItemIds!: string[];

  @IsOptional()
  @IsUUID()
  correctiveOperationalResourceId?: string;

  @IsOptional()
  @IsString()
  assignmentNotes?: string;
}

class RequestWarrantyExecutionBody {
  @IsString()
  executionReason!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  affectedServiceOrderItemIds!: string[];

  @IsOptional()
  @IsUUID()
  correctiveOperationalResourceId?: string;
}

@Controller('quality-records')
export class QualityRecordsController {
  constructor(
    private readonly qualityService: QualityService,
    private readonly productionOrderService: ProductionOrderService,
  ) {}

  @Permissions('quality.read')
  @Get()
  async list(@Query() query: SearchQualityRecordsDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.productionOrderId) {
      const order = await this.productionOrderService.getById(query.productionOrderId, tenantId);
      this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    }
    return this.qualityService.searchRecords(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('quality.write')
  @Post()
  async create(@Body() body: CreateQualityRecordBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const order = await this.productionOrderService.getById(body.productionOrderId, tenantId);
    this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    return this.qualityService.createRecord({ ...(body as any), tenantId, actorUserId: principal.userId });
  }

  @Permissions('quality.read')
  @Get(':qualityRecordId')
  async getById(@Param('qualityRecordId', new ParseUUIDPipe()) qualityRecordId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRecordDetails(tenantId, qualityRecordId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('quality.write')
  @Patch(':qualityRecordId')
  async update(@Param('qualityRecordId', new ParseUUIDPipe()) qualityRecordId: string, @Body() body: UpdateQualityRecordBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRecordDetails(tenantId, qualityRecordId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.qualityService.updateRecord(qualityRecordId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('quality.write')
  @Post(':qualityRecordId/approve')
  async approve(@Param('qualityRecordId', new ParseUUIDPipe()) qualityRecordId: string, @Body() body: QualityDecisionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRecordDetails(tenantId, qualityRecordId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.qualityService.approve(qualityRecordId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('quality.write')
  @Post(':qualityRecordId/reject')
  async reject(@Param('qualityRecordId', new ParseUUIDPipe()) qualityRecordId: string, @Body() body: QualityDecisionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRecordDetails(tenantId, qualityRecordId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.qualityService.reject(qualityRecordId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('quality.write')
  @Post(':qualityRecordId/request-rework')
  async requestRework(@Param('qualityRecordId', new ParseUUIDPipe()) qualityRecordId: string, @Body() body: RequestReworkBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRecordDetails(tenantId, qualityRecordId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.qualityService.requestRework(qualityRecordId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('quality.write')
  @Post(':qualityRecordId/request-warranty-execution')
  async requestWarrantyExecution(@Param('qualityRecordId', new ParseUUIDPipe()) qualityRecordId: string, @Body() body: RequestWarrantyExecutionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRecordDetails(tenantId, qualityRecordId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.qualityService.requestWarrantyExecution(qualityRecordId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }
}

@Controller('production-orders/:productionOrderId/quality')
export class ProductionOrderQualityController {
  constructor(private readonly qualityService: QualityService, private readonly productionOrderService: ProductionOrderService) {}

  @Permissions('quality.read')
  @Get()
  async listByProductionOrder(@Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const order = await this.productionOrderService.getById(productionOrderId, tenantId);
    this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    return this.qualityService.listByProductionOrder(tenantId, productionOrderId);
  }
}
