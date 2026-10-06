import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ensureSslModeRequire, resolveRemoteSsl } from '../postgres-url';
import { typeOrmEntities } from './entities';

export function buildTypeOrmOptions(): TypeOrmModuleOptions & PostgresConnectionOptions {
  const rawUrl = process.env.DATABASE_URL?.trim() || undefined;
  const databaseUrl = rawUrl ? ensureSslModeRequire(rawUrl) : undefined;
  const ssl = resolveRemoteSsl(databaseUrl);
  const shared = {
    type: 'postgres' as const,
    schema: process.env.DB_SCHEMA ?? 'public',
    entities: [...typeOrmEntities],
    migrations: ['dist/platform/database/typeorm/migrations/*.js'],
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  };

  if (databaseUrl) {
    return {
      ...shared,
      url: databaseUrl,
      ssl,
      extra: ssl ? { ssl } : undefined,
    };
  }

  return {
    ...shared,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'anexsys',
    ssl,
    extra: ssl ? { ssl } : undefined,
  };
}
