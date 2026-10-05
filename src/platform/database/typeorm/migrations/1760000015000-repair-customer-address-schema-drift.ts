import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairCustomerAddressSchemaDrift1760000015000 implements MigrationInterface {
  name = 'RepairCustomerAddressSchemaDrift1760000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_number text NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS country text NULL`);
    await queryRunner.query(`UPDATE customers SET branch_id = NULL WHERE branch_id IS NOT NULL`);
    await queryRunner.query(`UPDATE customers SET country = COALESCE(NULLIF(country, ''), 'Brasil')`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_tenant_document_active
      ON customers (tenant_id, cpf_cnpj)
      WHERE is_deleted = false AND cpf_cnpj IS NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // Repair migration: intentionally no-op.
  }
}
