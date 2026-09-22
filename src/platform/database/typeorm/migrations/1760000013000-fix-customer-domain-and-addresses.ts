import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCustomerDomainAndAddresses1760000013000 implements MigrationInterface {
  name = 'FixCustomerDomainAndAddresses1760000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_number text NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS country text NULL`);
    await queryRunner.query(`UPDATE customers SET branch_id = NULL`);
    await queryRunner.query(`UPDATE customers SET country = COALESCE(country, 'Brasil')`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_tenant_document_active
      ON customers (tenant_id, cpf_cnpj)
      WHERE is_deleted = false AND cpf_cnpj IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_customers_tenant_document_active`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS country`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN IF EXISTS address_number`);
  }
}
