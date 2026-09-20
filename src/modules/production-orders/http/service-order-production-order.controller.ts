import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { ProductionOrderService } from '../application/production-order/production-order.service';

@Controller('service-orders/:serviceOrderId/production-order')
export class ServiceOrderProductionOrderController {
  constructor(private readonly productionOrderService: ProductionOrderService) {}

  @Permissions('production_orders.write')
  @Post('generate')
  async generate(
    @Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    return this.productionOrderService.generateFromServiceOrder({
      tenantId,
      serviceOrderId,
      actorUserId: principal.userId,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }
}
