import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceOrderFloorStatus1760000030000 } from 'src/platform/database/typeorm/migrations/1760000030000-service-order-floor-status';

describe('ServiceOrderFloorStatus1760000030000', () => {
  it('allows in_production, awaiting_quality and in_rework on the OS status check', async () => {
    const executedQueries: string[] = [];
    const migration = new ServiceOrderFloorStatus1760000030000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.equal(executedQueries.length, 2);
    assert.match(executedQueries[1] ?? '', /'in_production'/);
    assert.match(executedQueries[1] ?? '', /'awaiting_quality'/);
    assert.match(executedQueries[1] ?? '', /'in_rework'/);
  });
});
