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
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
    }),
  );

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
