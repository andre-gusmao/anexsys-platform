import { DataSource } from 'typeorm';
import { AtelierCatalogAndOsItemFields1760000024000 } from './migrations/1760000024000-atelier-catalog-and-os-item-fields';
import { ServiceOrderPromisedDeliveryTime1760000023000 } from './migrations/1760000023000-service-order-promised-delivery-time';

export async function applyPendingMigrations(dataSource: DataSource): Promise<void> {
  if (typeof dataSource.runMigrations === 'function') {
    try {
      await dataSource.runMigrations();
    } catch {
      // Se o TypeORM não achar o arquivo da migração, o reparo abaixo ainda cria as colunas.
    }
  }

  await ensureAtelierOsSchema(dataSource);
}

export async function ensureAtelierOsSchema(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    await new ServiceOrderPromisedDeliveryTime1760000023000().up(queryRunner);
    await new AtelierCatalogAndOsItemFields1760000024000().up(queryRunner);
  } finally {
    await queryRunner.release();
  }
}
