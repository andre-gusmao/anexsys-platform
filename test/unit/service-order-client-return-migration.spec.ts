import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceOrderClientReturn1760000031000 } from 'src/platform/database/typeorm/migrations/1760000031000-service-order-client-return';

describe('ServiceOrderClientReturn1760000031000', () => {
  it('adds origin, return kind and picked_up on the OS status check', async () => {
    const executedQueries: string[] = [];
    const migration = new ServiceOrderClientReturn1760000031000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.equal(executedQueries.some((sql) => sql.includes('origin_service_order_id')), true);
    assert.equal(executedQueries.some((sql) => sql.includes('return_kind')), true);
    assert.equal(
      executedQueries.some((sql) => sql.includes("'picked_up'") && sql.includes("'ready_for_pickup'")),
      true,
    );
  });
});
