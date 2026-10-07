import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from './entities';
import { buildTypeOrmOptions, resolveTypeOrmMigrationFiles } from './typeorm.config';

export default new DataSource({
  ...buildTypeOrmOptions(),
  entities: [...typeOrmEntities],
  migrations: [resolveTypeOrmMigrationFiles()],
});
