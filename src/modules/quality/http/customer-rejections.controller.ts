import { Inject, Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { CustomerRejectionResolutionType, CustomerRejectionStatus, DefectSeverity } from 'src/shared/domain/enums';
import { QualityService } from '../application/quality/quality.service';
import { SearchCustomerRejectionsDto } from '../contracts/dto/search-customer-rejections.dto';

class CreateCustomerRejectionBody {
  @IsUUID()
  serviceOrderId!: string;

  @IsUUID()
  serviceOrderItemId!: string;

  @IsOptional()
  @IsUUID()
  qualityRecordId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  reportedQuantity?: number;

  @IsString()
  rejectionReason!: string;

  @IsOptional()
  @IsEnum(DefectSeverity)
  severity?: DefectSeverity;

  @IsOptional()
  @IsEnum(CustomerRejectionResolutionType)
  resolutionType?: CustomerRejectionResolutionType;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateCustomerRejectionBody {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  reportedQuantity?: number;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsEnum(DefectSeverity)
  severity?: DefectSeverity;

  @IsOptional()
  @IsEnum(CustomerRejectionResolutionType)
  resolutionType?: CustomerRejectionResolutionType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(CustomerRejectionStatus)
  status?: CustomerRejectionStatus;
}

@Controller('customer-rejections')
export class CustomerRejectionsController {
  constructor(
    @Inject(QualityService)
    private readonly qualityService: QualityService,
    @Inject(ServiceOrderService)
    private readonly serviceOrderService: ServiceOrderService,
  ) {}

  @Permissions('quality.read')
  @Get()
  async list(@Query() query: SearchCustomerRejectionsDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.serviceOrderId) {
      const serviceOrder = await this.serviceOrderService.getById(query.serviceOrderId, tenantId);
      this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    }
    return this.qualityService.searchRejections(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('quality.write')
  @Post()
  async create(@Body() body: CreateCustomerRejectionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(body.serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.qualityService.createRejection({ ...(body as any), tenantId, actorUserId: principal.userId });
  }

  @Permissions('quality.read')
  @Get(':customerRejectionId')
  async getById(@Param('customerRejectionId', new ParseUUIDPipe()) customerRejectionId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRejectionDetails(tenantId, customerRejectionId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('quality.write')
  @Patch(':customerRejectionId')
  async update(@Param('customerRejectionId', new ParseUUIDPipe()) customerRejectionId: string, @Body() body: UpdateCustomerRejectionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.qualityService.getRejectionDetails(tenantId, customerRejectionId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return this.qualityService.updateRejection(customerRejectionId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }
}
