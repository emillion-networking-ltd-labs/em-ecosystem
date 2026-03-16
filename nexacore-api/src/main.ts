import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { registerHelmetMiddleware } from './common/middleware/helmet.middleware';
import { registerHttpsRedirectMiddleware } from './common/middleware/https-redirect.middleware';
import { SecurityConfig } from './security/security.config';
import { validateProductionSecrets } from './common/utils/validate-production-secrets';

async function bootstrap() {
  validateProductionSecrets();

  const app = await NestFactory.create(AppModule);

  registerHttpsRedirectMiddleware(app);
  registerHelmetMiddleware(app);

  app.use(cookieParser());

  const allowedOrigins = SecurityConfig.cors.getAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // ACCEPTED RISK [H-06]: Requests without Origin header are intentionally
      // allowed. These come from non-browser clients (server-to-server, cURL,
      // Postman) and same-origin requests. Browsers always send Origin for
      // cross-origin requests, so CORS protection remains effective.
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
    exposedHeaders: SecurityConfig.cors.exposedHeaders,
    credentials: SecurityConfig.cors.credentials,
    maxAge: SecurityConfig.cors.maxAge,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.flatMap((err) =>
          err.constraints
            ? Object.values(err.constraints)
            : [`${err.property} validation failed`],
        );
        return new BadRequestException(messages);
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (swaggerEnabled) {
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
  } else {
    const logger = new Logger('Bootstrap');
    logger.log('Swagger UI disabled (production mode)');
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
