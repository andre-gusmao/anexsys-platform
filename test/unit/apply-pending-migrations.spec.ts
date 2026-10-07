import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPendingMigrations } from 'src/platform/database/typeorm/apply-pending-migrations';

function buildDataSource(runMigrations?: () => Promise<unknown>) {
  const executedQueries: string[] = [];
  const queryRunner = {
    async connect() {
      return undefined;
    },
    async release() {
      return undefined;
    },
    async query(sql: string) {
      executedQueries.push(sql);
      return [];
    },
  };

  return {
    executedQueries,
    dataSource: {
      async runMigrations() {
        if (runMigrations) {
          return runMigrations();
        }
        return [];
      },
      createQueryRunner() {
        return queryRunner;
      },
    },
  };
}

describe('applyPendingMigrations', () => {
  it('always issues the idempotent OS column and catalog SQL', async () => {
    const { dataSource, executedQueries } = buildDataSource();

    await applyPendingMigrations(dataSource as never);

    assert.equal(
      executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS promised_delivery_time')),
      true,
    );
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS garment_products')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS product_id')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS max_pieces_per_bag')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS group_id')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS version_suffix')), true);
  });

  it('still repairs the schema when TypeORM cannot load the migration files', async () => {
    const { dataSource, executedQueries } = buildDataSource(async () => {
      throw new Error('No migrations found');
    });

    await applyPendingMigrations(dataSource as never);

    assert.equal(
      executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS promised_delivery_time')),
      true,
    );
  });
});
