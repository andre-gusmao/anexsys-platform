import { Controller, Get, BadRequestException } from '@nestjs/common';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { IsolationReportService } from '../application/company/isolation-report.service';

@Controller('tenancy')
export class IsolationReportController {
  constructor(
    private readonly isolationReportService: IsolationReportService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Permissions('platform.tenants.create')
  @Get('isolation-report')
  async report() {
    return this.isolationReportService.buildReport();
  }

  @Permissions('users.read')
  @Get('access-impact')
  async accessImpact(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    return this.authorizationService.getTenantAccessImpact(tenantId);
  }
}
