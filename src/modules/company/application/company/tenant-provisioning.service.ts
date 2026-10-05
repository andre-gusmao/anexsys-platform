import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { PermissionRepository } from 'src/modules/authorization/infrastructure/persistence/repositories/permission.repository';
import { RolePermissionRepository } from 'src/modules/authorization/infrastructure/persistence/repositories/role-permission.repository';
import { RoleRepository } from 'src/modules/authorization/infrastructure/persistence/repositories/role.repository';
import { TenantContext } from 'src/platform/tenancy/tenant-context';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { ATELIER_ROLES, PILOT_MODULE_CODES } from '../company.defaults';
import { TenantModuleRepository } from '../../infrastructure/persistence/repositories/tenant-module.repository';
import { CompanyService } from './company.service';

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly companyService: CompanyService,
    private readonly authorizationService: AuthorizationService,
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly tenantModuleRepository: TenantModuleRepository,
  ) {}

  async provisionNewAccount(input: {
    code: string;
    legalName: string;
    displayName: string;
    cnpj?: string | null;
    actorUserId: string;
  }) {
    return TenantContext.run({ tenantId: null, bypass: true }, async () => {
      const tenant = await this.tenantService.create({
        code: input.code,
        legalName: input.legalName,
        displayName: input.displayName,
        actorUserId: input.actorUserId,
      });
      const company = await this.companyService.create({
        tenantId: tenant.id,
        legalName: input.legalName,
        tradeName: input.displayName,
        cnpj: input.cnpj ?? null,
        createDefaultBranch: true,
        actorUserId: input.actorUserId,
      });
      await this.ensureAtelierRoles(tenant.id, input.actorUserId);
      await this.ensurePilotModules(tenant.id, input.actorUserId);
      return { tenant, company };
    });
  }

  async ensureAtelierRoles(tenantId: string, actorUserId: string): Promise<void> {
    for (const roleDef of ATELIER_ROLES) {
      let role = await this.roleRepository.findByTenantAndCode(tenantId, roleDef.code);
      if (!role) {
        role = await this.authorizationService.createRole({
          tenantId,
          code: roleDef.code,
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystemManaged: true,
          actorUserId,
        });
      }
      for (const permissionCode of roleDef.permissions) {
        let permission = await this.permissionRepository.findByTenantAndCode(tenantId, permissionCode);
        if (!permission) {
          permission = await this.authorizationService.createPermission({
            tenantId,
            code: permissionCode,
            displayName: permissionCode,
            actorUserId,
          });
        }
        const existing = await this.rolePermissionRepository.findByRoleAndPermission(tenantId, role.id, permission.id);
        if (!existing) {
          await this.authorizationService.assignPermissionToRole({
            tenantId,
            roleId: role.id,
            permissionId: permission.id,
            actorUserId,
          });
        }
      }
    }
  }

  async ensurePilotModules(tenantId: string, actorUserId: string): Promise<void> {
    const existing = await this.tenantModuleRepository.findByTenant(tenantId);
    if (existing.length > 0) {
      return;
    }
    const rows = PILOT_MODULE_CODES.map((module) =>
      this.tenantModuleRepository.create({
        id: randomUUID(),
        tenantId,
        code: module.code,
        displayName: module.displayName,
        isEnabled: module.enabled,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      }),
    );
    await this.tenantModuleRepository.saveMany(rows);
  }
}
