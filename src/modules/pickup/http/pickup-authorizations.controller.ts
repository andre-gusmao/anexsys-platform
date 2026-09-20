import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { DigitalApprovalDecision, InteractionChannel, PickupAuthorizationPath, PickupAuthorizationStatus, PickupCredentialType } from 'src/shared/domain/enums';
import { SearchPickupAuthorizationsDto } from '../contracts/dto/search-pickup-authorizations.dto';
import { PickupService } from '../application/pickup/pickup.service';

class SearchPickupAuthorizationsQuery implements SearchPickupAuthorizationsDto {
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() serviceOrderId?: string;
  @IsOptional() @IsEnum(PickupAuthorizationStatus) status?: PickupAuthorizationStatus;
  accessibleBranchIds!: string[];
}

class CreatePickupAuthorizationBody {
  @IsString() authorizedPersonName!: string;
  @IsOptional() @IsString() authorizedPersonDocument?: string;
  @IsEnum(PickupAuthorizationPath) authorizationPath!: PickupAuthorizationPath;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsDateString() validUntil!: string;
  @Type(() => Boolean) @IsOptional() @IsBoolean() requireRemoteApproval?: boolean;
}

class IssueCredentialBody {
  @IsOptional() @IsString() value?: string;
  @IsDateString() expiresAt!: string;
}

class RequestRemoteApprovalBody {
  @IsEnum(InteractionChannel) channel!: InteractionChannel;
  @IsOptional() @IsString() messageSummary?: string;
}

class DecideRemoteApprovalBody {
  @IsUUID() approvalId!: string;
  @IsEnum(DigitalApprovalDecision) decision!: DigitalApprovalDecision;
  @IsEnum(InteractionChannel) channel!: InteractionChannel;
  @IsOptional() @IsString() decisionNotes?: string;
}

class EvidenceReferenceBody {
  @IsString() sourceLabel!: string;
  @IsString() referenceUri!: string;
  @IsOptional() @IsDateString() capturedAt?: string;
  @IsOptional() @IsString() notes?: string;
}

class CompletePickupAuthorizationBody {
  @IsEnum(PickupCredentialType) authorizationMethod!: PickupCredentialType;
  @IsOptional() @IsString() credentialValue?: string;
  @IsOptional() @IsUUID() approvalId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsUUID() operationalResourceId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => EvidenceReferenceBody) @IsOptional() cameraSnapshots?: EvidenceReferenceBody[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => EvidenceReferenceBody) @IsOptional() cctvReferences?: EvidenceReferenceBody[];
}

@Controller()
export class PickupAuthorizationsController {
  constructor(private readonly pickupService: PickupService, private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('pickup.read')
  @Get('pickup-authorizations')
  async list(@Query() query: SearchPickupAuthorizationsQuery, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.serviceOrderId) {
      const serviceOrder = await this.serviceOrderService.getById(query.serviceOrderId, tenantId);
      this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    }
    return this.pickupService.searchPickupAuthorizations(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('pickup.write')
  @Post('service-orders/:serviceOrderId/pickup-authorizations')
  async create(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @Body() body: CreatePickupAuthorizationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.pickupService.createPickupAuthorization({ ...body, tenantId, actorUserId: principal.userId, serviceOrderId });
  }

  @Permissions('pickup.read')
  @Get('pickup-authorizations/:pickupAuthorizationId')
  async getById(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.pickupService.getPickupAuthorizationDetails(tenantId, pickupAuthorizationId);
    const serviceOrder = await this.serviceOrderService.getById(details.authorization.serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('pickup.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/tokens')
  async issueToken(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @Body() body: IssueCredentialBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    await this.assertPickupAuthorizationBranchScope(tenantId, pickupAuthorizationId, principal.effectiveBranchIds);
    return this.pickupService.issuePickupToken({ ...body, tenantId, actorUserId: principal.userId, pickupAuthorizationId });
  }

  @Permissions('pickup.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/qr-codes')
  async issueQrCode(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @Body() body: IssueCredentialBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    await this.assertPickupAuthorizationBranchScope(tenantId, pickupAuthorizationId, principal.effectiveBranchIds);
    return this.pickupService.issuePickupQrCode({ ...body, tenantId, actorUserId: principal.userId, pickupAuthorizationId });
  }

  @Permissions('pickup.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/temporary-codes')
  async issueTemporaryCode(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @Body() body: IssueCredentialBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    await this.assertPickupAuthorizationBranchScope(tenantId, pickupAuthorizationId, principal.effectiveBranchIds);
    return this.pickupService.issueTemporaryPickupCode({ ...body, tenantId, actorUserId: principal.userId, pickupAuthorizationId });
  }

  @Permissions('pickup.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/remote-approval/request')
  async requestRemoteApproval(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @Body() body: RequestRemoteApprovalBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    await this.assertPickupAuthorizationBranchScope(tenantId, pickupAuthorizationId, principal.effectiveBranchIds);
    return this.pickupService.requestRemoteApproval({ ...body, tenantId, actorUserId: principal.userId, pickupAuthorizationId });
  }

  @Permissions('pickup.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/remote-approval/decision')
  async decideRemoteApproval(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @Body() body: DecideRemoteApprovalBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    await this.assertPickupAuthorizationBranchScope(tenantId, pickupAuthorizationId, principal.effectiveBranchIds);
    return this.pickupService.decideRemoteApproval({ ...body, tenantId, actorUserId: principal.userId, pickupAuthorizationId });
  }

  @Permissions('pickup.write', 'custody.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/complete')
  async complete(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @Body() body: CompletePickupAuthorizationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    await this.assertPickupAuthorizationBranchScope(tenantId, pickupAuthorizationId, principal.effectiveBranchIds);
    return this.pickupService.completePickupAuthorization({ ...body, tenantId, actorUserId: principal.userId, pickupAuthorizationId });
  }

  private async assertPickupAuthorizationBranchScope(tenantId: string, pickupAuthorizationId: string, accessibleBranchIds: string[]) {
    const details = await this.pickupService.getPickupAuthorizationDetails(tenantId, pickupAuthorizationId);
    const serviceOrder = await this.serviceOrderService.getById(details.authorization.serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, accessibleBranchIds);
    return details;
  }
}
