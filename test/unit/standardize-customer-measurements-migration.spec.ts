import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StandardizeCustomerMeasurements1760000012000 } from 'src/platform/database/typeorm/migrations/1760000012000-standardize-customer-measurements';
import { FixCustomerDomainAndAddresses1760000013000 } from 'src/platform/database/typeorm/migrations/1760000013000-fix-customer-domain-and-addresses';
import { RepairTenantDefaultMeasurementUnitCode1760000014000 } from 'src/platform/database/typeorm/migrations/1760000014000-repair-tenant-default-measurement-unit-code';
import { RepairCustomerAddressSchemaDrift1760000015000 } from 'src/platform/database/typeorm/migrations/1760000015000-repair-customer-address-schema-drift';

describe('StandardizeCustomerMeasurements1760000012000', () => {
  it('uses idempotent tenant column, table, and index DDL', async () => {
    const executedQueries: string[] = [];
    const migration = new StandardizeCustomerMeasurements1760000012000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.equal(
      executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS default_measurement_unit_code varchar(20)')),
      true,
    );
    assert.equal(
      executedQueries.some((sql) => sql.includes("SET default_measurement_unit_code = 'CM'")),
      true,
    );
    assert.equal(
      executedQueries.some((sql) => sql.includes("ALTER COLUMN default_measurement_unit_code SET DEFAULT 'CM'")),
      true,
    );
    assert.equal(
      executedQueries.some((sql) => sql.includes('ALTER COLUMN default_measurement_unit_code SET NOT NULL')),
      true,
    );
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS measurement_body_parts')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS measurement_units')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS measurement_sets')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS measurement_set_items')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_measurement_body_parts_tenant_id')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_measurement_units_tenant_id')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_measurement_sets_customer_id')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE INDEX IF NOT EXISTS idx_measurement_set_items_set_id')), true);
  });

  it('supports the pending recovery chain from migration state 11', async () => {
    const executedQueries: string[] = [];
    const queryRunner = {
      async query(sql: string) {
        executedQueries.push(sql);
      },
    };

    await new StandardizeCustomerMeasurements1760000012000().up(queryRunner as never);
    await new FixCustomerDomainAndAddresses1760000013000().up(queryRunner as never);
    await new RepairTenantDefaultMeasurementUnitCode1760000014000().up(queryRunner as never);
    await new RepairCustomerAddressSchemaDrift1760000015000().up(queryRunner as never);

    assert.equal(executedQueries.length > 0, true);
    assert.equal(
      executedQueries.filter((sql) => sql.includes('ADD COLUMN IF NOT EXISTS default_measurement_unit_code')).length >= 2,
      true,
    );
    assert.equal(executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS address_number')), true);
  });
});
