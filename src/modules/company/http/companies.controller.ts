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
import { IsEmail, IsOptional, IsString, Length, MaxLength, ValidateIf } from 'class-validator';

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CompanyService } from '../application/company/company.service';

class CompanyFiscalBody {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => hasText(value))
  @IsString()
  @Length(14, 18)
  cnpj?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  stateRegistration?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  municipalRegistration?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => hasText(value))
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => hasText(value))
  @IsString()
  @MaxLength(2)
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string | null;
}

class CreateCompanyBody extends CompanyFiscalBody {
  @IsString()
  @MaxLength(200)
  legalName!: string;
}

class UpdateCompanyBody extends CompanyFiscalBody {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;
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
