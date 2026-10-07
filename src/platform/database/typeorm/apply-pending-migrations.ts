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
  const missingDeliveryTime = await isColumnMissing(dataSource, 'service_orders', 'promised_delivery_time');
  const missingProductId = await isColumnMissing(dataSource, 'service_order_items', 'product_id');

  if (!missingDeliveryTime && !missingProductId) {
    return;
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    if (missingDeliveryTime) {
      await new ServiceOrderPromisedDeliveryTime1760000023000().up(queryRunner);
    }
    if (missingProductId) {
      await new AtelierCatalogAndOsItemFields1760000024000().up(queryRunner);
    }
  } finally {
    await queryRunner.release();
  }
}

async function isColumnMissing(dataSource: DataSource, tableName: string, columnName: string): Promise<boolean> {
  try {
    const rows = (await dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
      `,
      [tableName, columnName],
    )) as unknown[];
    return rows.length === 0;
  } catch {
    return true;
  }
}
