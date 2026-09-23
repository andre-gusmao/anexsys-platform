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
import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { CustomerStatus, CustomerType } from 'src/shared/domain/enums';
import { CreateCustomerDto, CreateCustomerRequestDto } from '../contracts/dto/create-customer.dto';
import {
  CreateMeasurementRecordDto,
  MeasurementSetItemInputDto,
} from '../contracts/dto/create-measurement-record.dto';
import { SearchCustomersDto } from '../contracts/dto/search-customers.dto';
import { UpdateCustomerDto, UpdateCustomerRequestDto } from '../contracts/dto/update-customer.dto';
import { CustomerService } from '../application/customer/customer.service';
import { MeasurementService } from '../application/measurement/measurement.service';

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
    const measurements = await this.measurementService.listByCustomer(tenantId, customerId);

    return {
      ...profile,
      latestMeasurements: measurements.latestByLabel,
    };
  }

  @Permissions('customers.write')
  @Post()
  async create(
    @Body() body: CreateCustomerRequestDto,
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
    @Body() body: UpdateCustomerRequestDto,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!tenantId || !principal) {
      throw new UnauthorizedException('Authenticated tenant context is required.');
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
    await this.customerService.getById(customerId, tenantId);
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
    await this.customerService.getById(customerId, tenantId);

    return this.measurementService.create({
      ...(body as CreateMeasurementRecordDto),
      tenantId,
      customerId,
      actorUserId: principal.userId,
    });
  }
}
