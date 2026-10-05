import { BadRequestException, Body, Controller, Get, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { TenantModuleRepository } from '../infrastructure/persistence/repositories/tenant-module.repository';

class UpdateTenantModuleBody {
  @IsBoolean()
  isEnabled!: boolean;
}

@Controller('tenant-modules')
export class TenantModulesController {
  constructor(private readonly tenantModuleRepository: TenantModuleRepository) {}

  @Permissions('tenants.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    return this.tenantModuleRepository.findByTenant(tenantId);
  }

  @Permissions('tenants.write')
  @Patch(':code')
  async update(
    @Param('code') code: string,
    @Body() body: UpdateTenantModuleBody,
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
    const module = await this.tenantModuleRepository.findByTenantAndCode(tenantId, code);
    if (!module) {
      throw new BadRequestException(`Módulo '${code}' não encontrado nesta Conta.`);
    }
    module.isEnabled = body.isEnabled;
    module.updatedBy = actorUserId;
    return this.tenantModuleRepository.save(module);
  }
}
