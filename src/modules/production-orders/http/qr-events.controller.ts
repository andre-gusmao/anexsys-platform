import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { QrTrackingService } from '../application/qr-tracking/qr-tracking.service';
import { SearchQrEventsDto } from '../contracts/dto/search-qr-events.dto';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { ProductionOrderStatus, QrScanType } from 'src/shared/domain/enums';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';

class ScanQrEventBody {
  @IsString()
  codeValue!: string;

  @IsEnum(QrScanType)
  scanType!: QrScanType;

  @IsOptional()
  @IsUUID()
  operationalResourceId?: string;

  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  targetStatus?: ProductionOrderStatus;

  @IsOptional()
  @IsString()
  diaryEntry?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

@Controller('qr-events')
export class QrEventsController {
  constructor(
    private readonly qrTrackingService: QrTrackingService,
    private readonly operationalResourceService: OperationalResourceService,
  ) {}

  @Permissions('production_orders.read')
  @Get()
  async list(
    @Query() query: SearchQrEventsDto,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }
    if (query.operationalResourceId) {
      await this.operationalResourceService.assertResourceBranchAccess(
        query.operationalResourceId,
        tenantId,
        principal.effectiveBranchIds,
      );
    }

    return this.qrTrackingService.searchEvents(tenantId, {
      ...query,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }

  @Permissions('production_orders.write')
  @Post('scan')
  async scan(
    @Body() body: ScanQrEventBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (body.operationalResourceId) {
      await this.operationalResourceService.assertResourceBranchAccess(
        body.operationalResourceId,
        tenantId,
        principal.effectiveBranchIds,
      );
    }

    return this.qrTrackingService.scan(tenantId, {
      ...body,
      actorUserId: principal.userId,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }
}
