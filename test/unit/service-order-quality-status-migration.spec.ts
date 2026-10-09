import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceOrderQualityStatus1760000029000 } from 'src/platform/database/typeorm/migrations/1760000029000-service-order-quality-status';

describe('ServiceOrderQualityStatus1760000029000', () => {
  it('replaces the OS status check so quality and ready_for_pickup are allowed', async () => {
    const executedQueries: string[] = [];
    const migration = new ServiceOrderQualityStatus1760000029000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.equal(executedQueries.length, 2);
    assert.match(executedQueries[0] ?? '', /DROP CONSTRAINT IF EXISTS chk_service_orders_status/);
    assert.match(executedQueries[1] ?? '', /ADD CONSTRAINT chk_service_orders_status/);
    assert.match(executedQueries[1] ?? '', /'quality'/);
    assert.match(executedQueries[1] ?? '', /'ready_for_pickup'/);
  });
});
