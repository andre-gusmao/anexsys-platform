import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CustomerIdentificationMethod, InteractionChannel, SmartConciergeQueueStatus } from 'src/shared/domain/enums';
import { SmartConciergeService } from '../application/smart-concierge/smart-concierge.service';

class QueueQuery {
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsEnum(SmartConciergeQueueStatus) status?: SmartConciergeQueueStatus;
  @IsOptional() @IsString() q?: string;
}

class CreateCheckInBody {
  @IsUUID() branchId!: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() serviceOrderId?: string;
  @IsOptional() @IsUUID() pickupAuthorizationId?: string;
  @IsEnum(CustomerIdentificationMethod) identificationMethod!: CustomerIdentificationMethod;
  @IsOptional() @IsString() identificationValue?: string;
  @IsOptional() @IsString() notes?: string;
}

class HandoffBody {
  @IsEnum(SmartConciergeQueueStatus) status!: SmartConciergeQueueStatus;
  @IsOptional() @IsUUID() attendantUserId?: string;
  @IsOptional() @IsString() notes?: string;
}

class NotificationBody {
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() serviceOrderId?: string;
  @IsEnum(InteractionChannel) channel!: InteractionChannel;
  @IsOptional() @IsString() subject?: string;
  @IsString() messageSummary!: string;
}

@Controller('smart-concierge')
export class SmartConciergeController {
  constructor(private readonly smartConciergeService: SmartConciergeService) {}

  @Permissions('smart-concierge.read')
  @Get('queue')
  async getQueue(@Query() query: QueueQuery, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.smartConciergeService.getQueue(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('smart-concierge.write')
  @Post('check-ins')
  async createCheckIn(@Body() body: CreateCheckInBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.smartConciergeService.createCheckIn({ ...body, tenantId, actorUserId: principal.userId });
  }

  @Permissions('smart-concierge.read')
  @Get('check-ins/:checkInId')
  async getCheckIn(@Param('checkInId', new ParseUUIDPipe()) checkInId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.smartConciergeService.getCheckInDetails(tenantId, checkInId);
  }

  @Permissions('smart-concierge.write')
  @Post('check-ins/:checkInId/handoff')
  async handoff(@Param('checkInId', new ParseUUIDPipe()) checkInId: string, @Body() body: HandoffBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.smartConciergeService.handoff({ ...body, tenantId, actorUserId: principal.userId, checkInId });
  }

  @Permissions('smart-concierge.write')
  @Post('notifications')
  async sendNotification(@Body() body: NotificationBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    return this.smartConciergeService.sendNotification({ ...body, tenantId, actorUserId: principal.userId });
  }
}
