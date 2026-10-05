import { createNestApp } from './create-app';

async function bootstrap(): Promise<void> {
  const app = await createNestApp();
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
