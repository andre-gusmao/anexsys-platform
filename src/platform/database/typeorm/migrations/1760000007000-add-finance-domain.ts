import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinanceDomain1760000007000 implements MigrationInterface {
  name = 'AddFinanceDomain1760000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN block_delivery_with_outstanding_balance boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN payment_terms_days integer NOT NULL DEFAULT 0,
      ADD CONSTRAINT chk_service_orders_payment_terms_days CHECK (payment_terms_days >= 0)
    `);

    await queryRunner.query(`
      CREATE TABLE payment_records (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        payment_reference_no varchar(50) NULL,
        payment_method varchar(30) NOT NULL,
        payment_provider varchar(30) NULL,
        payment_direction varchar(20) NOT NULL,
        payment_amount numeric(18,2) NOT NULL,
        received_at timestamptz NULL,
        authorized_at timestamptz NULL,
        reconciled_at timestamptz NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_payment_records_amount CHECK (payment_amount >= 0),
        CONSTRAINT chk_payment_records_direction CHECK (payment_direction IN ('inbound', 'outbound')),
        CONSTRAINT chk_payment_records_status CHECK (status IN ('authorized', 'received', 'settled', 'reversed', 'failed')),
        CONSTRAINT chk_payment_records_method CHECK (payment_method IN ('cash', 'card', 'pix', 'bank_transfer', 'other')),
        CONSTRAINT chk_payment_records_provider CHECK (payment_provider IS NULL OR payment_provider IN ('stone', 'cielo', 'pagbank'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE partial_payments (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        payment_record_id uuid NOT NULL REFERENCES payment_records(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        service_order_item_id uuid NULL REFERENCES service_order_items(id),
        allocated_amount numeric(18,2) NOT NULL,
        allocated_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_partial_payments_amount CHECK (allocated_amount > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE financial_exceptions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        payment_record_id uuid NULL REFERENCES payment_records(id),
        exception_type varchar(40) NOT NULL,
        reason text NOT NULL,
        amount_impact numeric(18,2) NULL,
        opened_at timestamptz NOT NULL,
        resolved_at timestamptz NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_financial_exceptions_status CHECK (status IN ('open', 'resolved')),
        CONSTRAINT chk_financial_exceptions_type CHECK (exception_type IN ('refund', 'chargeback', 'reversal', 'overpayment', 'underpayment', 'duplicate_payment', 'allocation_correction', 'failed_settlement'))
      )
    `);

    await queryRunner.query('CREATE INDEX idx_payment_records_order ON payment_records (service_order_id, created_at DESC)');
    await queryRunner.query('CREATE INDEX idx_partial_payments_order ON partial_payments (service_order_id, allocated_at DESC)');
    await queryRunner.query('CREATE INDEX idx_financial_exceptions_order ON financial_exceptions (service_order_id, opened_at DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_financial_exceptions_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_partial_payments_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_payment_records_order');
    await queryRunner.query('DROP TABLE IF EXISTS financial_exceptions');
    await queryRunner.query('DROP TABLE IF EXISTS partial_payments');
    await queryRunner.query('DROP TABLE IF EXISTS payment_records');
    await queryRunner.query('ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS chk_service_orders_payment_terms_days');
    await queryRunner.query('ALTER TABLE service_orders DROP COLUMN IF EXISTS payment_terms_days');
    await queryRunner.query('ALTER TABLE tenants DROP COLUMN IF EXISTS block_delivery_with_outstanding_balance');
  }
}
