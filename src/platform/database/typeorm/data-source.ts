import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from './entities';
import { buildTypeOrmOptions } from './typeorm.config';

export default new DataSource({
  ...buildTypeOrmOptions(),
  entities: [...typeOrmEntities],
  migrations: ['src/platform/database/typeorm/migrations/*.ts'],
});
