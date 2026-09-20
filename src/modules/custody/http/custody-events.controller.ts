import { Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Query, UnauthorizedException } from '@nestjs/common';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { CustodyEventStage } from 'src/shared/domain/enums';
import { CustodyService } from '../application/custody/custody.service';

class SearchCustodyEventsQuery {
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() serviceOrderId?: string;
  @IsOptional() @IsUUID() productionOrderId?: string;
  @IsOptional() @IsUUID() pickupAuthorizationId?: string;
  @IsOptional() @IsEnum(CustodyEventStage) eventStage?: CustodyEventStage;
}

@Controller('custody-events')
export class CustodyEventsController {
  constructor(private readonly custodyService: CustodyService) {}

  @Permissions('custody.read')
  @Get()
  async list(@Query() query: SearchCustodyEventsQuery, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return this.custodyService.searchCustodyEvents(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('custody.read')
  @Get(':custodyEventId')
  async getById(@Param('custodyEventId', new ParseUUIDPipe()) custodyEventId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.custodyService.getCustodyEventById(tenantId, custodyEventId);
    if (!principal.effectiveBranchIds.includes(details.custodyEvent.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return details;
  }
}
