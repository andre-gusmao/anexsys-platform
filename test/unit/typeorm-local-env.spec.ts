import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTypeOrmOptions } from '../../src/platform/database/typeorm/typeorm.config';

test('TypeORM usa DB_PASSWORD do ambiente quando não há DATABASE_URL', () => {
  const previousUrl = process.env.DATABASE_URL;
  const previousPassword = process.env.DB_PASSWORD;
  delete process.env.DATABASE_URL;
  process.env.DB_PASSWORD = 'postgree';

  try {
    const options = buildTypeOrmOptions();
    assert.equal('url' in options && Boolean(options.url), false);
    assert.equal(options.password, 'postgree');
    assert.equal(Array.isArray(options.migrations), true);
    assert.match(String(options.migrations?.[0]), /migrations[\\/]\*\.(ts|js)$/);
  } finally {
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
    if (previousPassword === undefined) {
      delete process.env.DB_PASSWORD;
    } else {
      process.env.DB_PASSWORD = previousPassword;
    }
  }
});
