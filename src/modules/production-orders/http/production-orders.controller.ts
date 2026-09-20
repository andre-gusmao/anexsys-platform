import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { DeliveryType, ProductionOrderVersionReason } from 'src/shared/domain/enums';
import { ProductionOrderService } from '../application/production-order/production-order.service';
import { CompleteProductionOrderDto } from '../contracts/dto/complete-production-order.dto';
import { CreateProductionOrderVersionDto } from '../contracts/dto/create-production-order-version.dto';
import { PauseProductionOrderDto } from '../contracts/dto/pause-production-order.dto';
import { ScheduleProductionOrderDto } from '../contracts/dto/schedule-production-order.dto';
import { SearchProductionOrdersDto } from '../contracts/dto/search-production-orders.dto';
import { StartProductionOrderDto } from '../contracts/dto/start-production-order.dto';
import { UpdateProductionOrderDto } from '../contracts/dto/update-production-order.dto';

class UpdateProductionOrderBody {
  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsOptional()
  @IsDateString()
  customerDeliveryTargetDate?: string;

  @IsOptional()
  @IsDateString()
  internalProductionDeadline?: string;

  @IsOptional()
  @IsDateString()
  internalQualityDeadline?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedQuantity?: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  pieceDescription?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

class ScheduleProductionOrderBody {
  @IsDateString()
  scheduledStartAt!: string;

  @IsOptional()
  @IsDateString()
  scheduledEndAt?: string;

  @IsUUID()
  primaryResourceId!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participantResourceIds?: string[];

  @IsOptional()
  @IsString()
  assignmentNotes?: string;
}

class StartProductionOrderBody {
  @IsOptional()
  @IsUUID()
  operationalResourceId?: string;

  @IsOptional()
  @IsString()
  diaryEntry?: string;
}

class PauseProductionOrderBody {
  @IsOptional()
  @IsString()
  diaryEntry?: string;
}

class CompleteProductionOrderBody {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  producedQuantity?: number;

  @IsOptional()
  @IsString()
  diaryEntry?: string;
}

class CreateProductionOrderVersionBody {
  @IsEnum(ProductionOrderVersionReason)
  versionReason!: ProductionOrderVersionReason;

  @IsOptional()
  @IsBoolean()
  activate?: boolean;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsString()
  changeSummary!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedQuantity?: number;

  @IsOptional()
  @IsDateString()
  scheduledStartAt?: string;

  @IsOptional()
  @IsDateString()
  scheduledEndAt?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  pieceDescription?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  resourceChangeNotes?: string;
}

@Controller('production-orders')
export class ProductionOrdersController {
  constructor(
    private readonly productionOrderService: ProductionOrderService,
    private readonly operationalResourceService: OperationalResourceService,
  ) {}

  @Permissions('production_orders.read')
  @Get()
  async list(
    @Query() query: SearchProductionOrdersDto,
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

    return this.productionOrderService.search(tenantId, {
      ...query,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }

  @Permissions('production_orders.read')
  @Get(':productionOrderId')
  async getById(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    return this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
  }

  @Permissions('production_orders.write')
  @Patch(':productionOrderId')
  async update(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @Body() body: UpdateProductionOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.update(productionOrderId, tenantId, {
      ...(body as UpdateProductionOrderDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('production_orders.write')
  @Post(':productionOrderId/schedule')
  async schedule(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @Body() body: ScheduleProductionOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    await this.assertResourceIdsInsideScope([body.primaryResourceId, ...(body.participantResourceIds ?? [])], principal.effectiveBranchIds, tenantId);
    return this.productionOrderService.schedule(productionOrderId, tenantId, {
      ...(body as ScheduleProductionOrderDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('production_orders.write')
  @Post(':productionOrderId/start')
  async start(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @Body() body: StartProductionOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    if (body.operationalResourceId) {
      await this.operationalResourceService.assertResourceBranchAccess(
        body.operationalResourceId,
        tenantId,
        principal.effectiveBranchIds,
      );
    }
    return this.productionOrderService.start(productionOrderId, tenantId, {
      ...(body as StartProductionOrderDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('production_orders.write')
  @Post(':productionOrderId/pause')
  async pause(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @Body() body: PauseProductionOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.pause(productionOrderId, tenantId, {
      ...(body as PauseProductionOrderDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('production_orders.write')
  @Post(':productionOrderId/complete')
  async complete(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @Body() body: CompleteProductionOrderBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.complete(productionOrderId, tenantId, {
      ...(body as CompleteProductionOrderDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('production_orders.write')
  @Post(':productionOrderId/versions')
  async createVersion(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @Body() body: CreateProductionOrderVersionBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.createVersion(productionOrderId, tenantId, {
      ...(body as CreateProductionOrderVersionDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('production_orders.read')
  @Get(':productionOrderId/versions')
  async listVersions(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.listVersions(productionOrderId, tenantId!);
  }

  @Permissions('production_orders.read')
  @Get(':productionOrderId/print-view')
  async getPrintView(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.getPrintView(tenantId!, productionOrderId);
  }

  @Permissions('production_orders.read')
  @Get(':productionOrderId/qr')
  async getQr(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.getActiveQrCode(tenantId!, productionOrderId);
  }

  @Permissions('production_orders.write')
  @Post(':productionOrderId/qr/reissue')
  async reissueQr(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.reissueQrCode(productionOrderId, tenantId, principal.userId);
  }

  @Permissions('production_orders.read')
  @Get(':productionOrderId/qr-events')
  async listQrEvents(
    @Param('productionOrderId', new ParseUUIDPipe()) productionOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    await this.getScopedProductionOrderDetails(productionOrderId, tenantId, request);
    return this.productionOrderService.listQrEvents(productionOrderId, tenantId!);
  }

  private async getScopedProductionOrderDetails(
    productionOrderId: string,
    tenantId: string | null,
    request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    const order = await this.productionOrderService.getById(productionOrderId, tenantId);
    this.productionOrderService.assertBranchAccess(order, principal.effectiveBranchIds);
    return this.productionOrderService.getDetails(tenantId, productionOrderId);
  }

  private async assertResourceIdsInsideScope(resourceIds: string[], accessibleBranchIds: string[], tenantId: string) {
    for (const resourceId of resourceIds) {
      await this.operationalResourceService.assertResourceBranchAccess(resourceId, tenantId, accessibleBranchIds);
    }
  }
}
