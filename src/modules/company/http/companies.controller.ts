import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CompanyService } from '../application/company/company.service';

class CreateCompanyBody {
  @IsString()
  legalName!: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsOptional()
  @IsString()
  @Length(14, 18)
  cnpj?: string;
}

class UpdateCompanyBody {
  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  tradeName?: string | null;

  @IsOptional()
  @IsString()
  cnpj?: string | null;
}

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companyService: CompanyService) {}

  @Permissions('companies.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    return this.companyService.listByTenant(tenantId);
  }

  @Permissions('companies.write')
  @Post()
  async create(
    @Body() body: CreateCompanyBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
    return this.companyService.create({ ...body, tenantId, actorUserId, createDefaultBranch: true });
  }

  @Permissions('companies.read')
  @Get(':companyId')
  async getById(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @CurrentTenantId() tenantId: string | null,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    return this.companyService.getById(companyId, tenantId);
  }

  @Permissions('companies.write')
  @Patch(':companyId')
  async update(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() body: UpdateCompanyBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
    return this.companyService.update(companyId, tenantId, { ...body, actorUserId });
  }
}
