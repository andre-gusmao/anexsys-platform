import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { applyPendingMigrations } from './platform/database/typeorm/apply-pending-migrations';
import { DomainExceptionFilter } from './platform/http/domain-exception.filter';

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  try {
    await applyPendingMigrations(app.get(DataSource));
  } catch (error) {
    console.warn('Não foi possível atualizar o banco da OS na subida.', error);
  }

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());

  const http = app.getHttpAdapter().getInstance() as { set?: (key: string, value: unknown) => void };
  if (typeof http.set === 'function') {
    http.set('trust proxy', 1);
  }

  return app;
}
