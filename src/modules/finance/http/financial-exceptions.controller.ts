import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UnauthorizedException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { FinancialExceptionType } from 'src/shared/domain/enums';
import { FinanceService } from '../application/finance/finance.service';

class CreateFinancialExceptionBody {
  @IsUUID()
  serviceOrderId!: string;

  @IsOptional()
  @IsUUID()
  paymentRecordId?: string;

  @IsEnum(FinancialExceptionType)
  exceptionType!: FinancialExceptionType;

  @IsString()
  reason!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountImpact?: number;
}

class ResolveFinancialExceptionBody {
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

@Controller('financial-exceptions')
export class FinancialExceptionsController {
  constructor(private readonly financeService: FinanceService, private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('finance.write')
  @Post()
  async create(@Body() body: CreateFinancialExceptionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(body.serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.financeService.createFinancialException({
      tenantId,
      actorUserId: principal.userId,
      serviceOrderId: body.serviceOrderId,
      paymentRecordId: body.paymentRecordId,
      exceptionType: body.exceptionType,
      reason: body.reason,
      amountImpact: body.amountImpact,
    });
  }

  @Permissions('finance.read')
  @Get(':financialExceptionId')
  async getById(@Param('financialExceptionId', new ParseUUIDPipe()) financialExceptionId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.financeService.getFinancialExceptionDetails(tenantId, financialExceptionId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('finance.write')
  @Post(':financialExceptionId/resolve')
  async resolve(@Param('financialExceptionId', new ParseUUIDPipe()) financialExceptionId: string, @Body() body: ResolveFinancialExceptionBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.financeService.getFinancialExceptionDetails(tenantId, financialExceptionId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return this.financeService.resolveFinancialException(financialExceptionId, tenantId, {
      actorUserId: principal.userId,
      resolutionNotes: body.resolutionNotes,
    });
  }
}
