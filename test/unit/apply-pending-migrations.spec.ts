import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPendingMigrations } from 'src/platform/database/typeorm/apply-pending-migrations';

function buildDataSource(options: {
  columns: Record<string, string[]>;
  runMigrations?: () => Promise<unknown>;
}) {
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
        if (options.runMigrations) {
          return options.runMigrations();
        }
        return [];
      },
      async query(sql: string, params: string[] = []) {
        if (sql.includes('information_schema.columns')) {
          const tableName = params[0];
          const columnName = params[1];
          return options.columns[tableName]?.includes(columnName) ? [{ '?column?': 1 }] : [];
        }
        executedQueries.push(sql);
        return [];
      },
      createQueryRunner() {
        return queryRunner;
      },
    },
  };
}

describe('applyPendingMigrations', () => {
  it('reuses the official OS migrations when promised_delivery_time is missing', async () => {
    const { dataSource, executedQueries } = buildDataSource({
      columns: {
        service_orders: ['promised_delivery_date'],
        service_order_items: ['description'],
      },
    });

    await applyPendingMigrations(dataSource as never);

    assert.equal(
      executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS promised_delivery_time')),
      true,
    );
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS garment_products')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS product_id')), true);
  });

  it('does not rewrite the OS schema when the new columns already exist', async () => {
    const { dataSource, executedQueries } = buildDataSource({
      columns: {
        service_orders: ['promised_delivery_time'],
        service_order_items: ['product_id'],
      },
    });

    await applyPendingMigrations(dataSource as never);

    assert.equal(executedQueries.length, 0);
  });

  it('still repairs the schema when TypeORM cannot load the migration files', async () => {
    const { dataSource, executedQueries } = buildDataSource({
      columns: {
        service_orders: [],
        service_order_items: ['product_id'],
      },
      async runMigrations() {
        throw new Error('No migrations found');
      },
    });

    await applyPendingMigrations(dataSource as never);

    assert.equal(
      executedQueries.some((sql) => sql.includes('ADD COLUMN IF NOT EXISTS promised_delivery_time')),
      true,
    );
    assert.equal(executedQueries.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS garment_products')), false);
  });
});
