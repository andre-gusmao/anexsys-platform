import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceOrderPromisedDeliveryTime1760000023000 } from 'src/platform/database/typeorm/migrations/1760000023000-service-order-promised-delivery-time';

describe('ServiceOrderPromisedDeliveryTime1760000023000', () => {
  it('adds promised_delivery_time only when the column is missing', async () => {
    const executedQueries: string[] = [];
    const migration = new ServiceOrderPromisedDeliveryTime1760000023000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.equal(executedQueries.length, 1);
    assert.match(executedQueries[0] ?? '', /ALTER TABLE service_orders/);
    assert.match(executedQueries[0] ?? '', /ADD COLUMN IF NOT EXISTS promised_delivery_time varchar\(5\)/);
  });
});
