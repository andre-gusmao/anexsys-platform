import { Inject, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { DigitalApprovalDecision, InteractionChannel, PickupAuthorizationPath, PickupCredentialType } from 'src/shared/domain/enums';
import { CustomerPortalService } from '../application/customer-portal/customer-portal.service';

class LinkPortalProfileBody {
  @IsUUID() customerId!: string;
  @IsUUID() userId!: string;
  @IsOptional() @IsString() customerCode?: string;
  @IsOptional() @IsBoolean() vipFlag?: boolean;
  @IsOptional() @IsEnum(InteractionChannel) preferredChannel?: InteractionChannel;
}

class UpdateProfileBody {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() mobilePhone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(InteractionChannel) preferredChannel?: InteractionChannel;
}

class CreateApprovalRequestBody {
  @IsUUID() serviceOrderId!: string;
  @IsEnum(InteractionChannel) channel!: InteractionChannel;
  @IsOptional() @IsString() title?: string;
  @IsString() messageSummary!: string;
}

class DecideApprovalBody {
  @IsOptional() @IsString() decisionNotes?: string;
}

class CreatePortalPickupAuthorizationBody {
  @IsString() authorizedPersonName!: string;
  @IsOptional() @IsString() authorizedPersonDocument?: string;
  @IsEnum(PickupAuthorizationPath) authorizationPath!: PickupAuthorizationPath;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsDateString() validUntil!: string;
  @IsOptional() @IsBoolean() requireRemoteApproval?: boolean;
  @IsOptional() @IsEnum(PickupCredentialType) credentialType?: PickupCredentialType;
  @IsOptional() @IsDateString() expiresAt?: string;
}

class CreateWarrantyRequestBody {
  @IsUUID() serviceOrderId!: string;
  @IsOptional() @IsUUID() serviceOrderItemId?: string;
  @IsString() adjustmentReason!: string;
}

@Controller('customer-portal')
export class CustomerPortalController {
  constructor(
    @Inject(CustomerPortalService)
    private readonly customerPortalService: CustomerPortalService,
  ) {}

  @Permissions('customer-portal.manage')
  @Post('profiles')
  async linkProfile(@Body() body: LinkPortalProfileBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.linkCustomerProfile({ ...body, tenantId, actorUserId: principal.userId });
  }

  @Permissions('customer-portal.read')
  @Get('me')
  async getMe(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.getAuthenticatedProfile(tenantId, principal.userId);
  }

  @Permissions('customer-portal.write')
  @Patch('profile')
  async updateProfile(@Body() body: UpdateProfileBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.updateAuthenticatedProfile(tenantId, principal.userId, body);
  }

  @Permissions('customer-portal.read')
  @Get('orders')
  async listOrders(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.listOrders(tenantId, principal.userId, principal.effectiveBranchIds);
  }

  @Permissions('customer-portal.read')
  @Get('orders/:serviceOrderId')
  async getOrder(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.getOrderDetails(tenantId, principal.userId, serviceOrderId);
  }

  @Permissions('customer-portal.read')
  @Get('history')
  async getHistory(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.listHistory(tenantId, principal.userId, principal.effectiveBranchIds);
  }

  @Permissions('customer-portal.manage')
  @Post('approvals/requests')
  async createApprovalRequest(@Body() body: CreateApprovalRequestBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.createApprovalRequest({ ...body, tenantId, actorUserId: principal.userId });
  }

  @Permissions('customer-portal.read')
  @Get('approvals')
  async listApprovals(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.listApprovals(tenantId, principal.userId, principal.effectiveBranchIds);
  }

  @Permissions('customer-portal.write')
  @Post('approvals/:approvalId/approve')
  async approve(@Param('approvalId', new ParseUUIDPipe()) approvalId: string, @Body() body: DecideApprovalBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.approve(tenantId, principal.userId, approvalId, DigitalApprovalDecision.APPROVED, body.decisionNotes);
  }

  @Permissions('customer-portal.write')
  @Post('approvals/:approvalId/reject')
  async reject(@Param('approvalId', new ParseUUIDPipe()) approvalId: string, @Body() body: DecideApprovalBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.approve(tenantId, principal.userId, approvalId, DigitalApprovalDecision.REJECTED, body.decisionNotes);
  }

  @Permissions('customer-portal.write')
  @Post('approval-links/:approvalLinkToken/approve')
  async approveByLink(@Param('approvalLinkToken') approvalLinkToken: string, @Body() body: DecideApprovalBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.decideByLinkToken(tenantId, principal.userId, approvalLinkToken, DigitalApprovalDecision.APPROVED, body.decisionNotes);
  }

  @Permissions('customer-portal.write')
  @Post('approval-links/:approvalLinkToken/reject')
  async rejectByLink(@Param('approvalLinkToken') approvalLinkToken: string, @Body() body: DecideApprovalBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.decideByLinkToken(tenantId, principal.userId, approvalLinkToken, DigitalApprovalDecision.REJECTED, body.decisionNotes);
  }

  @Permissions('customer-portal.read')
  @Get('pickup-authorizations')
  async listPickupAuthorizations(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.listPickupAuthorizations(tenantId, principal.userId, principal.effectiveBranchIds);
  }

  @Permissions('customer-portal.write')
  @Post('service-orders/:serviceOrderId/pickup-authorizations')
  async createPickupAuthorization(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @Body() body: CreatePortalPickupAuthorizationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.createPickupAuthorization({ ...body, tenantId, actorUserId: principal.userId, userId: principal.userId, serviceOrderId });
  }

  @Permissions('customer-portal.write')
  @Post('pickup-authorizations/:pickupAuthorizationId/revoke')
  async revokePickupAuthorization(@Param('pickupAuthorizationId', new ParseUUIDPipe()) pickupAuthorizationId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.revokePickupAuthorization(tenantId, principal.userId, pickupAuthorizationId);
  }

  @Permissions('customer-portal.read')
  @Get('warranty-requests')
  async listWarranty(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.listWarrantyCases(tenantId, principal.userId, principal.effectiveBranchIds);
  }

  @Permissions('customer-portal.write')
  @Post('warranty-requests')
  async createWarranty(@Body() body: CreateWarrantyRequestBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.createWarrantyRequest({ ...body, tenantId, userId: principal.userId, actorUserId: principal.userId });
  }

  @Permissions('customer-portal.read')
  @Get('status-mappings')
  async listStatusMappings(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.customerPortalService.listStatusMappings(tenantId, principal.userId);
  }
}
