import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { registerHelmetMiddleware } from './common/middleware/helmet.middleware';
import { SecurityConfig } from './security/security.config';

function validateProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;

  const defaultJwtSecret = 'default-dev-secret-change-in-production';
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === defaultJwtSecret) {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a secure value in production',
    );
  }

  if (!process.env.MFA_ENCRYPTION_KEY || process.env.MFA_ENCRYPTION_KEY.length < 32) {
    throw new Error(
      'FATAL: MFA_ENCRYPTION_KEY must be at least 32 characters in production',
    );
  }
}

async function bootstrap() {
  validateProductionSecrets();

  const app = await NestFactory.create(AppModule);

  registerHelmetMiddleware(app);

  app.use(cookieParser());

  const allowedOrigins = SecurityConfig.cors.getAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: SecurityConfig.cors.methods,
    allowedHeaders: SecurityConfig.cors.allowedHeaders,
    credentials: SecurityConfig.cors.credentials,
    maxAge: SecurityConfig.cors.maxAge,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('EM NexaCore API')
    .setDescription(
      'EM Ecosystem Core Platform — Authentication & User Management',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
