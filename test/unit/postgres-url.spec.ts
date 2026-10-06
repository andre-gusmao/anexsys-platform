import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureSslModeRequire, resolveRemoteSsl } from '../../src/platform/database/postgres-url';

test('ensureSslModeRequire acrescenta sslmode=require quando a URL não tem parâmetro', () => {
  assert.equal(
    ensureSslModeRequire('postgresql://u:p@ep-x.neon.tech/neondb'),
    'postgresql://u:p@ep-x.neon.tech/neondb?sslmode=require',
  );
});

test('ensureSslModeRequire acrescenta sslmode=require se já houver query (channel_binding)', () => {
  assert.equal(
    ensureSslModeRequire('postgresql://u:p@ep-x.neon.tech/neondb?channel_binding=require'),
    'postgresql://u:p@ep-x.neon.tech/neondb?channel_binding=require&sslmode=require',
  );
});

test('ensureSslModeRequire promove sslmode fraco para require', () => {
  assert.equal(
    ensureSslModeRequire('postgresql://u:p@ep-x.neon.tech/neondb?sslmode=prefer'),
    'postgresql://u:p@ep-x.neon.tech/neondb?sslmode=require',
  );
});

test('resolveRemoteSsl liga SSL quando há DATABASE_URL', () => {
  const previousSsl = process.env.DB_SSL;
  const previousReject = process.env.DB_SSL_REJECT_UNAUTHORIZED;
  delete process.env.DB_SSL;
  delete process.env.DB_SSL_REJECT_UNAUTHORIZED;
  try {
    assert.deepEqual(resolveRemoteSsl('postgresql://u:p@host/db'), { rejectUnauthorized: true });
  } finally {
    if (previousSsl === undefined) {
      delete process.env.DB_SSL;
    } else {
      process.env.DB_SSL = previousSsl;
    }
    if (previousReject === undefined) {
      delete process.env.DB_SSL_REJECT_UNAUTHORIZED;
    } else {
      process.env.DB_SSL_REJECT_UNAUTHORIZED = previousReject;
    }
  }
});
