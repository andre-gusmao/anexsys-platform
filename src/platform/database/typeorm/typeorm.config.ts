import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { typeOrmEntities } from './entities';

export function buildTypeOrmOptions(): TypeOrmModuleOptions & PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'anexsys',
    schema: process.env.DB_SCHEMA ?? 'public',
    entities: [...typeOrmEntities],
    migrations: ['dist/platform/database/typeorm/migrations/*.js'],
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  };
}
