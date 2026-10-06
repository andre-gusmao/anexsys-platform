import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createIdleSessionState } from '../../frontend/src/components/providers/session-context';

describe('session first paint', () => {
  it('starts loading with no session so SSR and the client render the same text', () => {
    assert.deepEqual(createIdleSessionState(), {
      status: 'loading',
      session: null,
    });
  });
});
