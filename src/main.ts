import { AppModule } from './app.module';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, ClassSerializerInterceptor } from '@nestjs/common';
import { ResponseInterceptor } from './utils/interceptors/response_interceptor';
import { HttpExceptionFilter } from './utils/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  registerGlobals(app);
  registerSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}

const registerGlobals = (app: INestApplication) => {
  // `strategy: 'excludeAll'` requires every serialized property to opt in with
  // `@Expose()`. Most entities only carry a class-level `@Expose()` (which does
  // not reach nested/nameless response wrappers like `ApiResponseDto<T>`'s
  // generic `data` field), so responses were silently losing fields — plain
  // aggregate objects (reports) came back as `{}`, and relations like
  // `User.role`/`User.tenant` were dropped from list responses. The default
  // strategy exposes everything except what's explicitly `@Exclude()`d (e.g.
  // `User.createdAt/updatedAt/deletedAt`) or gated behind `@Expose({ groups })`
  // (e.g. `User.password`, which stays hidden since no group is ever passed
  // here) — so this does not expose anything that was deliberately hidden.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
};

const registerSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Swagger API')
    .setDescription('The backend documenation')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, documentFactory, {
    swaggerOptions: {
      docExpansion: false,
    },
  });
};

bootstrap();
