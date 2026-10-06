import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

export type DependencyValidationBlocker = {
  code: string;
  label: string;
  count: number;
  workspacePath: string;
};

export type DependencyValidationResult = {
  allowed: boolean;
  entityLabel: string;
  actionLabel: string;
  message: string;
  blockers: DependencyValidationBlocker[];
};

@Injectable()
export class DependencyValidationService {
  constructor(private readonly dataSource: DataSource) {}

  async validateTenantDeactivation(tenantId: string): Promise<DependencyValidationResult> {
    const [branches, customers, serviceOrders, users] = await Promise.all([
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM branches
        WHERE tenant_id = $1
          AND is_deleted = false
      `, [tenantId]),
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM customers
        WHERE tenant_id = $1
          AND is_deleted = false
      `, [tenantId]),
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM service_orders
        WHERE tenant_id = $1
          AND is_deleted = false
      `, [tenantId]),
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM user_identities
        WHERE tenant_id = $1
      `, [tenantId]),
    ]);

    return this.buildResult({
      entityLabel: 'Empresa',
      actionLabel: 'Desativar',
      blockers: [
        { code: 'branches', label: 'Filiais', count: branches, workspacePath: '/admin/branches' },
        { code: 'customers', label: 'Clientes', count: customers, workspacePath: '/customers' },
        { code: 'service-orders', label: 'Service Orders', count: serviceOrders, workspacePath: '/service-orders' },
        { code: 'users', label: 'Usuários e acessos', count: users, workspacePath: '/admin/access' },
      ],
    });
  }

  async validateBranchDeactivation(branchId: string): Promise<DependencyValidationResult> {
    const [children, serviceOrders, financialRecords, userScopes] = await Promise.all([
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM branches
        WHERE parent_branch_id = $1
          AND is_deleted = false
      `, [branchId]),
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM service_orders
        WHERE branch_id = $1
          AND is_deleted = false
      `, [branchId]),
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM payment_records
        WHERE branch_id = $1
      `, [branchId]),
      this.count(`
        SELECT COUNT(*)::int AS total
        FROM user_branch_scopes
        WHERE branch_id = $1
      `, [branchId]),
    ]);

    return this.buildResult({
      entityLabel: 'Filial',
      actionLabel: 'Desativar',
      blockers: [
        { code: 'child-branches', label: 'Filiais filhas', count: children, workspacePath: '/admin/branches' },
        { code: 'service-orders', label: 'Service Orders', count: serviceOrders, workspacePath: '/service-orders' },
        { code: 'financial-records', label: 'Registros financeiros', count: financialRecords, workspacePath: '/dashboard' },
        { code: 'user-scopes', label: 'Escopos de usuário', count: userScopes, workspacePath: '/admin/access' },
      ],
    });
  }

  async validateCustomerInactivation(tenantId: string, customerId: string): Promise<DependencyValidationResult> {
    return this.buildCustomerLifecycleResult(tenantId, customerId, 'Inativar');
  }

  async validateCustomerDeletion(tenantId: string, customerId: string): Promise<DependencyValidationResult> {
    return this.buildCustomerLifecycleResult(tenantId, customerId, 'Excluir');
  }

  async assertTenantCanDeactivate(tenantId: string): Promise<void> {
    const validation = await this.validateTenantDeactivation(tenantId);
    this.assertAllowed(validation);
  }

  async assertBranchCanDeactivate(branchId: string): Promise<void> {
    const validation = await this.validateBranchDeactivation(branchId);
    this.assertAllowed(validation);
  }

  async assertCustomerCanInactivate(tenantId: string, customerId: string): Promise<void> {
    const validation = await this.validateCustomerInactivation(tenantId, customerId);
    this.assertAllowed(validation);
  }

  async assertCustomerCanDelete(tenantId: string, customerId: string): Promise<void> {
    const validation = await this.validateCustomerDeletion(tenantId, customerId);
    this.assertAllowed(validation);
  }

  private async buildCustomerLifecycleResult(
    tenantId: string,
    customerId: string,
    actionLabel: 'Inativar' | 'Excluir',
  ): Promise<DependencyValidationResult> {
    const [serviceOrders, measurementSets, financialRecords] = await Promise.all([
      this.count(
        `
        SELECT COUNT(*)::int AS total
        FROM service_orders
        WHERE tenant_id = $1
          AND customer_id = $2
          AND is_deleted = false
      `,
        [tenantId, customerId],
      ),
      this.count(
        `
        SELECT COUNT(*)::int AS total
        FROM measurement_sets
        WHERE tenant_id = $1
          AND customer_id = $2
      `,
        [tenantId, customerId],
      ),
      this.count(
        `
        SELECT COUNT(DISTINCT payment_records.id)::int AS total
        FROM payment_records
        INNER JOIN service_orders ON service_orders.id = payment_records.service_order_id
        WHERE service_orders.tenant_id = $1
          AND service_orders.customer_id = $2
          AND service_orders.is_deleted = false
      `,
        [tenantId, customerId],
      ),
    ]);

    return this.buildResult({
      entityLabel: 'Cliente',
      actionLabel,
      blockers: [
        { code: 'service-orders', label: 'Service Orders', count: serviceOrders, workspacePath: '/service-orders' },
        { code: 'measurements', label: 'Medições', count: measurementSets, workspacePath: '/customers' },
        { code: 'financial-records', label: 'Registros financeiros', count: financialRecords, workspacePath: '/service-orders' },
      ],
    });
  }

  private async count(sql: string, params: Array<string>): Promise<number> {
    const [row] = await this.dataSource.query(sql, params);
    return Number(row?.total ?? 0);
  }

  private buildResult(input: {
    entityLabel: string;
    actionLabel: string;
    blockers: DependencyValidationBlocker[];
  }): DependencyValidationResult {
    const blockers = input.blockers.filter((blocker) => blocker.count > 0);
    if (blockers.length === 0) {
      return {
        allowed: true,
        entityLabel: input.entityLabel,
        actionLabel: input.actionLabel,
        message: `${input.entityLabel} sem dependências bloqueantes para ${input.actionLabel.toLowerCase()}.`,
        blockers: [],
      };
    }

    const linkedSummary = blockers.map((blocker) => `${blocker.count} ${blocker.label.toLowerCase()}`).join(', ');
    return {
      allowed: false,
      entityLabel: input.entityLabel,
      actionLabel: input.actionLabel,
      message: `${input.entityLabel} vinculada a ${linkedSummary}. Revise os registros relacionados antes de concluir a operação.`,
      blockers,
    };
  }

  private assertAllowed(validation: DependencyValidationResult) {
    if (!validation.allowed) {
      throw new DomainValidationError(validation.message);
    }
  }
}
