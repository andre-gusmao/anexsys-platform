import { Controller, ForbiddenException, Get, Query, UnauthorizedException } from '@nestjs/common';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { FinanceService } from '../application/finance/finance.service';
import { SearchActualCashflowDto } from '../contracts/dto/search-actual-cashflow.dto';
import { SearchExpectedCashflowDto } from '../contracts/dto/search-expected-cashflow.dto';

@Controller('cashflow')
export class CashflowController {
  constructor(private readonly financeService: FinanceService) {}

  @Permissions('finance.read')
  @Get('expected')
  async expected(@Query() query: SearchExpectedCashflowDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return this.financeService.getExpectedCashflow(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('finance.read')
  @Get('actual')
  async actual(@Query() query: SearchActualCashflowDto, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    return this.financeService.getActualCashflow(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }
}
