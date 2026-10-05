import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { typeOrmEntities } from './entities';

function resolveSsl(databaseUrl?: string): boolean | { rejectUnauthorized: boolean } | undefined {
  const explicit = (process.env.DB_SSL ?? '').toLowerCase();
  if (explicit === 'false' || explicit === '0' || explicit === 'off') {
    return undefined;
  }

  const url = databaseUrl ?? '';
  const urlWantsSsl = /sslmode=(require|verify-ca|verify-full)/i.test(url) || /neon\.tech/i.test(url);
  if (explicit === 'true' || explicit === '1' || explicit === 'on' || urlWantsSsl) {
    return {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  return undefined;
}

export function buildTypeOrmOptions(): TypeOrmModuleOptions & PostgresConnectionOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim() || undefined;
  const ssl = resolveSsl(databaseUrl);
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
  };
}
