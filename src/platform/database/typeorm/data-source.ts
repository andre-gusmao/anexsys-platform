import 'reflect-metadata';
import { extname, join } from 'node:path';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from './entities';
import { buildTypeOrmOptions } from './typeorm.config';

const migrationExtension = extname(__filename) === '.ts' ? 'ts' : 'js';

export default new DataSource({
  ...buildTypeOrmOptions(),
  entities: [...typeOrmEntities],
  migrations: [join(__dirname, 'migrations', `*.${migrationExtension}`)],
});
