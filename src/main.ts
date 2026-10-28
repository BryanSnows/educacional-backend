import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';
import { SwaggerService } from './configs/swagger/swagger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '1mb' }));
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  new SwaggerService().init(app);

  const port = Number(process.env.PORT ?? 3010);
  await app.listen(port);
  Logger.log(
    `API em http://localhost:${port} · Swagger em http://localhost:${port}/swagger`,
    'Bootstrap',
  );
}

void bootstrap();
