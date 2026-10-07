import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query, UnauthorizedException } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { QualityService } from '../application/quality/quality.service';

class QualityItemDecisionBody {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('quality-reviews')
export class QualityReviewsController {
  constructor(
    @Inject(QualityService)
    private readonly qualityService: QualityService,
    @Inject(ServiceOrderService)
    private readonly serviceOrderService: ServiceOrderService,
  ) {}

  @Permissions('quality.read')
  @Get()
  async list(@Query('q') q: string | undefined, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    return this.qualityService.searchReviews(tenantId, { q, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('quality.read')
  @Get(':serviceOrderId')
  async getByServiceOrder(
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
    return this.qualityService.getReview(tenantId, serviceOrderId, principal.effectiveBranchIds);
  }

  @Permissions('quality.write')
  @Post(':serviceOrderId/items/:serviceOrderItemId')
  async decideItem(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @Param('serviceOrderItemId', new ParseUUIDPipe()) serviceOrderItemId: string,
    @Body() body: QualityItemDecisionBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.qualityService.decideItem(
      tenantId,
      serviceOrderId,
      serviceOrderItemId,
      principal.userId,
      principal.effectiveBranchIds,
      body.decision,
      body.reason,
    );
  }

  @Permissions('quality.write')
  @Post(':serviceOrderId/enqueue')
  async enqueue(
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
    return this.qualityService.enqueue(tenantId, serviceOrderId, principal.userId, principal.effectiveBranchIds);
  }

  @Permissions('quality.write')
  @Post(':serviceOrderId/start-return')
  async startReturn(
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
    return this.qualityService.startReturn(tenantId, serviceOrderId, principal.userId, principal.effectiveBranchIds);
  }
}
