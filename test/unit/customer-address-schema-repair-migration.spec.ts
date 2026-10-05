import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RepairCustomerAddressSchemaDrift1760000015000 } from 'src/platform/database/typeorm/migrations/1760000015000-repair-customer-address-schema-drift';

describe('RepairCustomerAddressSchemaDrift1760000015000', () => {
  it('issues the expected idempotent customer schema repair SQL', async () => {
    const executedQueries: string[] = [];
    const migration = new RepairCustomerAddressSchemaDrift1760000015000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.deepEqual(executedQueries, [
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_number text NULL`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS country text NULL`,
      `UPDATE customers SET branch_id = NULL WHERE branch_id IS NOT NULL`,
      `UPDATE customers SET country = COALESCE(NULLIF(country, ''), 'Brasil')`,
      `
      CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_tenant_document_active
      ON customers (tenant_id, cpf_cnpj)
      WHERE is_deleted = false AND cpf_cnpj IS NOT NULL
    `,
    ]);
  });
});
