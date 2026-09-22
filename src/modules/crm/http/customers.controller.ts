import {
  BadRequestException,
  Body,
  Controller,
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
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CustomerStatus, CustomerType } from 'src/shared/domain/enums';
import { CreateCustomerDto } from '../contracts/dto/create-customer.dto';
import {
  CreateMeasurementRecordDto,
  MeasurementSetItemInputDto,
} from '../contracts/dto/create-measurement-record.dto';
import { SearchCustomersDto } from '../contracts/dto/search-customers.dto';
import { UpdateCustomerDto } from '../contracts/dto/update-customer.dto';
import { CustomerService } from '../application/customer/customer.service';
import { MeasurementService } from '../application/measurement/measurement.service';

class CreateCustomerBody {
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

  @IsString()
  street!: string;

  @IsString()
  number!: string;

  @IsString()
  complement!: string;

  @IsString()
  district!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

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
  @IsString()
  street?: string | null;

  @IsOptional()
  @IsString()
  number?: string | null;

  @IsOptional()
  @IsString()
  complement?: string | null;

  @IsOptional()
  @IsString()
  district?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  state?: string | null;

  @IsOptional()
  @IsString()
  country?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
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
  @IsOptional()
  @IsDateString()
  measurementDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MeasurementSetItemInputDto)
  items!: MeasurementSetItemInputDto[];
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

    return this.customerService.search(tenantId, query);
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
    const profile = await this.customerService.getProfile(tenantId, customerId);
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
    const customer = await this.customerService.getById(customerId, tenantId);
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
    const customer = await this.customerService.getById(customerId, tenantId);

    return this.measurementService.create({
      ...(body as CreateMeasurementRecordDto),
      tenantId,
      customerId,
      actorUserId: principal.userId,
    });
  }
}
