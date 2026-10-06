import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyFiscalProfile1760000018000 implements MigrationInterface {
  name = 'CompanyFiscalProfile1760000018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS state_registration varchar(30) NULL,
        ADD COLUMN IF NOT EXISTS municipal_registration varchar(30) NULL,
        ADD COLUMN IF NOT EXISTS email varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS phone varchar(30) NULL,
        ADD COLUMN IF NOT EXISTS postal_code varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS street text NULL,
        ADD COLUMN IF NOT EXISTS address_number text NULL,
        ADD COLUMN IF NOT EXISTS complement text NULL,
        ADD COLUMN IF NOT EXISTS district text NULL,
        ADD COLUMN IF NOT EXISTS city text NULL,
        ADD COLUMN IF NOT EXISTS state varchar(10) NULL,
        ADD COLUMN IF NOT EXISTS country text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
        DROP COLUMN IF EXISTS state_registration,
        DROP COLUMN IF EXISTS municipal_registration,
        DROP COLUMN IF EXISTS email,
        DROP COLUMN IF EXISTS phone,
        DROP COLUMN IF EXISTS postal_code,
        DROP COLUMN IF EXISTS street,
        DROP COLUMN IF EXISTS address_number,
        DROP COLUMN IF EXISTS complement,
        DROP COLUMN IF EXISTS district,
        DROP COLUMN IF EXISTS city,
        DROP COLUMN IF EXISTS state,
        DROP COLUMN IF EXISTS country
    `);
  }
}
