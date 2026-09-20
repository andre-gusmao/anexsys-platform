import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { ReworkCaseStatus } from 'src/shared/domain/enums';
import { ReworkService } from '../application/rework/rework.service';
import { SearchReworkCasesDto } from '../contracts/dto/search-rework-cases.dto';

class CreateReworkCaseBody {
  @IsUUID()
  productionOrderId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  affectedServiceOrderItemIds!: string[];

  @IsString()
  reworkReason!: string;

  @IsOptional()
  @IsUUID()
  correctiveOperationalResourceId?: string;

  @IsOptional()
  @IsString()
  assignmentNotes?: string;

  @IsOptional()
  @IsUUID()
  qualityRecordId?: string;

  @IsOptional()
  @IsUUID()
  customerRejectionId?: string;
}

class UpdateReworkCaseBody {
  @IsOptional()
  @IsString()
  reworkReason?: string;

  @IsOptional()
  @IsString()
  assignmentNotes?: string;

  @IsOptional()
  @IsEnum(ReworkCaseStatus)
  status?: ReworkCaseStatus;
}

class AssignReworkCaseBody {
  @IsUUID()
  correctiveOperationalResourceId!: string;

  @IsOptional()
  @IsString()
  assignmentNotes?: string;
}

class CloseReworkCaseBody {
  @IsOptional()
  @IsString()
  closureNotes?: string;
}

@Controller('rework-cases')
export class ReworkCasesController {
  constructor(private readonly reworkService: ReworkService, private readonly productionOrderService: ProductionOrderService) {}

  @Permissions('rework.read')
  @Get()
  async list(@Query() query: SearchReworkCasesDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.productionOrderId) {
      const order = await this.productionOrderService.getById(query.productionOrderId, tenantId);
      this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    }
    return this.reworkService.search(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('rework.write')
  @Post()
  async create(@Body() body: CreateReworkCaseBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const order = await this.productionOrderService.getById(body.productionOrderId, tenantId);
    this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    return this.reworkService.create({ ...(body as any), tenantId, actorUserId: principal.userId });
  }

  @Permissions('rework.read')
  @Get(':reworkCaseId')
  async getById(@Param('reworkCaseId', new ParseUUIDPipe()) reworkCaseId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.reworkService.getDetails(tenantId, reworkCaseId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('rework.write')
  @Patch(':reworkCaseId')
  async update(@Param('reworkCaseId', new ParseUUIDPipe()) reworkCaseId: string, @Body() body: UpdateReworkCaseBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.reworkService.getDetails(tenantId, reworkCaseId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.reworkService.update(reworkCaseId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('rework.write')
  @Post(':reworkCaseId/assign')
  async assign(@Param('reworkCaseId', new ParseUUIDPipe()) reworkCaseId: string, @Body() body: AssignReworkCaseBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.reworkService.getDetails(tenantId, reworkCaseId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.reworkService.assign(reworkCaseId, tenantId, { ...(body as any), actorUserId: principal.userId }, false);
  }

  @Permissions('rework.write')
  @Post(':reworkCaseId/reassign')
  async reassign(@Param('reworkCaseId', new ParseUUIDPipe()) reworkCaseId: string, @Body() body: AssignReworkCaseBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.reworkService.getDetails(tenantId, reworkCaseId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.reworkService.assign(reworkCaseId, tenantId, { ...(body as any), actorUserId: principal.userId }, true);
  }

  @Permissions('rework.write')
  @Post(':reworkCaseId/close')
  async close(@Param('reworkCaseId', new ParseUUIDPipe()) reworkCaseId: string, @Body() body: CloseReworkCaseBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.reworkService.getDetails(tenantId, reworkCaseId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.reworkService.close(reworkCaseId, tenantId, { ...(body as any), actorUserId: principal.userId });
  }

  @Permissions('rework.read')
  @Get(':reworkCaseId/attribution')
  async attribution(@Param('reworkCaseId', new ParseUUIDPipe()) reworkCaseId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.reworkService.getDetails(tenantId, reworkCaseId);
    this.productionOrderService.assertBranchAccess(details.productionOrder, principal.effectiveBranchIds);
    return this.reworkService.getAttribution(reworkCaseId, tenantId);
  }
}
