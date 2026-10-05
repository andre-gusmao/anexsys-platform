import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiscalDomain1760000008000 implements MigrationInterface {
  name = 'AddFiscalDomain1760000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fiscal_documents (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        service_order_item_id uuid NULL REFERENCES service_order_items(id),
        document_type varchar(40) NOT NULL,
        document_no varchar(60) NOT NULL,
        issued_at timestamptz NULL,
        status varchar(30) NOT NULL,
        gross_amount numeric(18,2) NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_fiscal_documents_branch_type_no UNIQUE (tenant_id, branch_id, document_type, document_no),
        CONSTRAINT chk_fiscal_documents_type CHECK (document_type IN ('nfse', 'nfe', 'credit_document', 'debit_document')),
        CONSTRAINT chk_fiscal_documents_status CHECK (status IN ('draft', 'issued', 'cancelled', 'error')),
        CONSTRAINT chk_fiscal_documents_gross_amount CHECK (gross_amount IS NULL OR gross_amount >= 0)
      )
    `);

    await queryRunner.query('CREATE INDEX idx_fiscal_documents_order ON fiscal_documents (service_order_id, created_at DESC)');
    await queryRunner.query('CREATE INDEX idx_fiscal_documents_order_item ON fiscal_documents (service_order_item_id, created_at DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_fiscal_documents_order_item');
    await queryRunner.query('DROP INDEX IF EXISTS idx_fiscal_documents_order');
    await queryRunner.query('DROP TABLE IF EXISTS fiscal_documents');
  }
}
