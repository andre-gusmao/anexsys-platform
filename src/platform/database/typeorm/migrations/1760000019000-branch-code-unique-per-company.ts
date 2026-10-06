import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchCodeUniquePerCompany1760000019000 implements MigrationInterface {
  name = 'BranchCodeUniquePerCompany1760000019000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE branches DROP CONSTRAINT IF EXISTS uq_branches_tenant_code`);
    await queryRunner.query(`
      ALTER TABLE branches
      ADD CONSTRAINT uq_branches_tenant_company_code UNIQUE (tenant_id, company_id, code)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE branches DROP CONSTRAINT IF EXISTS uq_branches_tenant_company_code`);
    await queryRunner.query(`
      ALTER TABLE branches
      ADD CONSTRAINT uq_branches_tenant_code UNIQUE (tenant_id, code)
    `);
  }
}
