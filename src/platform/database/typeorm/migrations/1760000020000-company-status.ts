import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyStatus1760000020000 implements MigrationInterface {
  name = 'CompanyStatus1760000020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'active'
    `);
    await queryRunner.query(`
      ALTER TABLE companies
      DROP CONSTRAINT IF EXISTS chk_companies_status
    `);
    await queryRunner.query(`
      ALTER TABLE companies
      ADD CONSTRAINT chk_companies_status CHECK (status IN ('active', 'inactive'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_companies_status`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS status`);
  }
}
