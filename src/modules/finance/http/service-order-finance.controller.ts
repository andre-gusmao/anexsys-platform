import { Controller, Get, Param, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { FinanceService } from '../application/finance/finance.service';

@Controller('service-orders/:serviceOrderId')
export class ServiceOrderFinanceController {
  constructor(private readonly financeService: FinanceService, private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('finance.read')
  @Get('financial-summary')
  async financialSummary(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.financeService.getFinancialSummary(tenantId, serviceOrderId);
  }

  @Permissions('finance.read')
  @Get('partial-payments')
  async partialPayments(@Param('serviceOrderId', new ParseUUIDPipe()) serviceOrderId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.financeService.listPartialPaymentsByServiceOrder(tenantId, serviceOrderId);
  }
}
