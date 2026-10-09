import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { applyPendingMigrations } from './platform/database/typeorm/apply-pending-migrations';
import { DomainExceptionFilter } from './platform/http/domain-exception.filter';
import { JSON_BODY_LIMIT } from './platform/http/json-body-limit';

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true });
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
