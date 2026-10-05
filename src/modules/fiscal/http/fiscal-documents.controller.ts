import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, UnauthorizedException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';
import { FiscalService } from '../application/fiscal/fiscal.service';
import { SearchFiscalDocumentsDto } from '../contracts/dto/search-fiscal-documents.dto';

class CreateFiscalDocumentBody {
  @IsUUID()
  serviceOrderId!: string;

  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsEnum(FiscalDocumentType)
  documentType!: FiscalDocumentType;

  @IsString()
  documentNo!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossAmount?: number;

  @IsOptional()
  @IsEnum(FiscalDocumentStatus)
  status?: FiscalDocumentStatus;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}

class SearchFiscalDocumentsQuery implements SearchFiscalDocumentsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsOptional()
  @IsEnum(FiscalDocumentType)
  documentType?: FiscalDocumentType;

  @IsOptional()
  @IsEnum(FiscalDocumentStatus)
  status?: FiscalDocumentStatus;
}

class IssueFiscalDocumentBody {
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossAmount?: number;

  @IsOptional()
  @IsString()
  providerStatus?: string;

  @IsOptional()
  @IsString()
  providerReferenceNo?: string;
}

class CancelFiscalDocumentBody {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  providerStatus?: string;
}

class SyncFiscalDocumentStatusBody {
  @IsEnum(FiscalDocumentStatus)
  status!: FiscalDocumentStatus;

  @IsOptional()
  @IsString()
  providerStatus?: string;

  @IsOptional()
  @IsString()
  providerReferenceNo?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('fiscal-documents')
export class FiscalDocumentsController {
  constructor(private readonly fiscalService: FiscalService, private readonly serviceOrderService: ServiceOrderService) {}

  @Permissions('fiscal.read', 'finance.read')
  @Get()
  async list(@Query() query: SearchFiscalDocumentsQuery, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    if (query.serviceOrderId) {
      const serviceOrder = await this.serviceOrderService.getById(query.serviceOrderId, tenantId);
      this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    }
    return this.fiscalService.searchFiscalDocuments(tenantId, { ...query, accessibleBranchIds: principal.effectiveBranchIds });
  }

  @Permissions('fiscal.write', 'finance.write')
  @Post()
  async create(@Body() body: CreateFiscalDocumentBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const serviceOrder = await this.serviceOrderService.getById(body.serviceOrderId, tenantId);
    this.serviceOrderService.assertBranchAccess(serviceOrder, principal.effectiveBranchIds);
    return this.fiscalService.createFiscalDocument({
      tenantId,
      actorUserId: principal.userId,
      serviceOrderId: body.serviceOrderId,
      serviceOrderItemId: body.serviceOrderItemId,
      documentType: body.documentType,
      documentNo: body.documentNo,
      grossAmount: body.grossAmount,
      status: body.status,
      issuedAt: body.issuedAt,
    });
  }

  @Permissions('fiscal.read', 'finance.read')
  @Get(':fiscalDocumentId')
  async getById(@Param('fiscalDocumentId', new ParseUUIDPipe()) fiscalDocumentId: string, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.fiscalService.getFiscalDocumentDetails(tenantId, fiscalDocumentId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return details;
  }

  @Permissions('fiscal.write', 'finance.write')
  @Post(':fiscalDocumentId/issue')
  async issue(@Param('fiscalDocumentId', new ParseUUIDPipe()) fiscalDocumentId: string, @Body() body: IssueFiscalDocumentBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.fiscalService.getFiscalDocumentDetails(tenantId, fiscalDocumentId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return this.fiscalService.issueFiscalDocument(fiscalDocumentId, tenantId, {
      actorUserId: principal.userId,
      issuedAt: body.issuedAt,
      grossAmount: body.grossAmount,
      providerStatus: body.providerStatus,
      providerReferenceNo: body.providerReferenceNo,
    });
  }

  @Permissions('fiscal.write', 'finance.write')
  @Post(':fiscalDocumentId/cancel')
  async cancel(@Param('fiscalDocumentId', new ParseUUIDPipe()) fiscalDocumentId: string, @Body() body: CancelFiscalDocumentBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.fiscalService.getFiscalDocumentDetails(tenantId, fiscalDocumentId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return this.fiscalService.cancelFiscalDocument(fiscalDocumentId, tenantId, {
      actorUserId: principal.userId,
      reason: body.reason,
      providerStatus: body.providerStatus,
    });
  }

  @Permissions('fiscal.write', 'finance.write')
  @Post(':fiscalDocumentId/sync-status')
  async syncStatus(@Param('fiscalDocumentId', new ParseUUIDPipe()) fiscalDocumentId: string, @Body() body: SyncFiscalDocumentStatusBody, @CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) throw new UnauthorizedException('Authenticated tenant context is required.');
    const details = await this.fiscalService.getFiscalDocumentDetails(tenantId, fiscalDocumentId);
    this.serviceOrderService.assertBranchAccess(details.serviceOrder, principal.effectiveBranchIds);
    return this.fiscalService.syncFiscalStatus(fiscalDocumentId, tenantId, {
      actorUserId: principal.userId,
      status: body.status,
      providerStatus: body.providerStatus,
      providerReferenceNo: body.providerReferenceNo,
      issuedAt: body.issuedAt,
      grossAmount: body.grossAmount,
      notes: body.notes,
    });
  }
}
