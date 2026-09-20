import {
  BadRequestException,
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
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CustomerStatus, CustomerType } from 'src/shared/domain/enums';
import { CreateCustomerDto } from '../contracts/dto/create-customer.dto';
import {
  CreateMeasurementRecordDto,
  CustomMeasurementInputDto,
} from '../contracts/dto/create-measurement-record.dto';
import { SearchCustomersDto } from '../contracts/dto/search-customers.dto';
import { UpdateCustomerDto } from '../contracts/dto/update-customer.dto';
import { CustomerService } from '../application/customer/customer.service';
import { MeasurementService } from '../application/measurement/measurement.service';

class CreateCustomerBody {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  branchId?: string | null;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsString()
  fullName!: string;

  @IsString()
  mobilePhone!: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  tradeName?: string;
}

class UpdateCustomerBody {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  branchId?: string | null;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  cpf?: string | null;

  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  observations?: string | null;

  @IsOptional()
  @IsString()
  tradeName?: string | null;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}

class CreateMeasurementsBody {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CustomMeasurementInputDto)
  customMeasurements?: CustomMeasurementInputDto[];

  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly measurementService: MeasurementService,
  ) {}

  @Permissions('customers.read')
  @Get()
  async search(
    @Query() query: SearchCustomersDto,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!principal) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
    if (query.branchId && !principal.effectiveBranchIds.includes(query.branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }

    return this.customerService.search(tenantId, {
      ...query,
      accessibleBranchIds: principal.effectiveBranchIds,
    });
  }

  @Permissions('customers.read')
  @Get(':customerId')
  async getById(
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    const profile = await this.customerService.getProfile(tenantId, customerId);
    this.customerService.assertCustomerBranchAccess(profile.customer, principal.effectiveBranchIds);
    const measurements = await this.measurementService.listByCustomer(tenantId, customerId);

    return {
      ...profile,
      latestMeasurements: measurements.latestByLabel,
    };
  }

  @Permissions('customers.write')
  @Post()
  async create(
    @Body() body: CreateCustomerBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }
    if (body.branchId && !principal.effectiveBranchIds.includes(body.branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }

    return this.customerService.create({
      ...(body as CreateCustomerDto),
      tenantId,
      actorUserId: principal.userId,
    });
  }

  @Permissions('customers.write')
  @Patch(':customerId')
  async update(
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() body: UpdateCustomerBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    const currentCustomer = await this.customerService.getById(customerId, tenantId);
    this.customerService.assertCustomerBranchAccess(currentCustomer, principal.effectiveBranchIds);
    if (body.branchId && !principal.effectiveBranchIds.includes(body.branchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }
    if (body.status === CustomerStatus.BLOCKED) {
      throw new BadRequestException('Blocked customer lifecycle is outside Sprint 2 scope.');
    }

    return this.customerService.update(customerId, tenantId, {
      ...(body as UpdateCustomerDto),
      actorUserId: principal.userId,
    });
  }

  @Permissions('measurements.read')
  @Get(':customerId/measurements')
  async listMeasurements(
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    const customer = await this.customerService.getById(customerId, tenantId);
    this.customerService.assertCustomerBranchAccess(customer, principal.effectiveBranchIds);
    return this.measurementService.listByCustomer(tenantId, customerId);
  }

  @Permissions('measurements.write')
  @Post(':customerId/measurements')
  async createMeasurements(
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() body: CreateMeasurementsBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
    }

    const customer = await this.customerService.getById(customerId, tenantId);
    this.customerService.assertCustomerBranchAccess(customer, principal.effectiveBranchIds);

    return this.measurementService.create({
      ...(body as CreateMeasurementRecordDto),
      tenantId,
      customerId,
      actorUserId: principal.userId,
    });
  }
}
