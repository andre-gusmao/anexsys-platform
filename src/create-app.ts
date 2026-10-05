import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './platform/http/domain-exception.filter';

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

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
