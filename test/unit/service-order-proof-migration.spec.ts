import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceOrderProof1760000032000 } from 'src/platform/database/typeorm/migrations/1760000032000-service-order-proof';

describe('ServiceOrderProof1760000032000', () => {
  it('adds awaiting_proof on the OS status check', async () => {
    const executedQueries: string[] = [];
    const migration = new ServiceOrderProof1760000032000();

    await migration.up({
      async query(sql: string) {
        executedQueries.push(sql);
      },
    } as never);

    assert.equal(executedQueries.length, 2);
    assert.match(executedQueries[1] ?? '', /'awaiting_proof'/);
    assert.match(executedQueries[1] ?? '', /'in_production'/);
    assert.match(executedQueries[1] ?? '', /'awaiting_quality'/);
    assert.match(executedQueries[1] ?? '', /'picked_up'/);
  });
});
