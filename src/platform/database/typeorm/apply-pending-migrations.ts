import { DataSource } from 'typeorm';
import { AtelierCatalogAndOsItemFields1760000024000 } from './migrations/1760000024000-atelier-catalog-and-os-item-fields';
import { ServiceOrderPromisedDeliveryTime1760000023000 } from './migrations/1760000023000-service-order-promised-delivery-time';
import { ServiceOrderBags1760000025000 } from './migrations/1760000025000-service-order-bags';
import { ServiceOrderActualDeliveryTime1760000026000 } from './migrations/1760000026000-service-order-actual-delivery-time';
import { ServiceOrderBagClosed1760000027000 } from './migrations/1760000027000-service-order-bag-closed';
import { ServiceOrderItemEquipment1760000028000 } from './migrations/1760000028000-service-order-item-equipment';
import { ServiceOrderQualityStatus1760000029000 } from './migrations/1760000029000-service-order-quality-status';

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
    await new ServiceOrderBags1760000025000().up(queryRunner);
    await new ServiceOrderActualDeliveryTime1760000026000().up(queryRunner);
    await new ServiceOrderBagClosed1760000027000().up(queryRunner);
    await new ServiceOrderItemEquipment1760000028000().up(queryRunner);
    await new ServiceOrderQualityStatus1760000029000().up(queryRunner);
  } finally {
    await queryRunner.release();
  }
}
