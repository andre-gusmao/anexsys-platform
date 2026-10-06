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
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { normalizeRequestValue, PlatformRequest } from 'src/platform/http/request-context';
import { CompanyService } from '../application/company/company.service';

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireTenantId(tenantId: string | null, request: PlatformRequest): string {
  const resolved =
    normalizeRequestValue(tenantId) ?? normalizeRequestValue(request.requestContext.authenticatedPrincipal?.tenantId);
  if (!resolved) {
    throw new BadRequestException('O contexto da Conta é obrigatório para o cadastro de empresas.');
  }
  return resolved;
}

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
  async list(@CurrentTenantId() tenantId: string | null, @CurrentRequest() request: PlatformRequest) {
    return this.companyService.listByTenant(requireTenantId(tenantId, request));
  }

  @Permissions('companies.write')
  @Post()
  async create(
    @Body() body: CreateCompanyBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
    return this.companyService.create({
      ...body,
      tenantId: requireTenantId(tenantId, request),
      actorUserId,
      createDefaultBranch: true,
    });
  }

  @Permissions('companies.read')
  @Get(':companyId')
  async getById(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    return this.companyService.getById(companyId, requireTenantId(tenantId, request));
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
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
    return this.companyService.update(companyId, requireTenantId(tenantId, request), { ...body, actorUserId });
  }
}
