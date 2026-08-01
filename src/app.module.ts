import {
  REDIS_PORT,
  REDIS_HOST,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_USER,
  POSTGRES_PORT,
  POSTGRES_PASSWORD,
} from './utils/constants';

// NestJS
import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';

import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule, SharedBullAsyncConfiguration } from '@nestjs/bullmq';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Strategies
import { JwtStrategy } from './utils/strategies/jwt.strategy';

// Guards
import { RoleGuard } from './utils/guards/role.guard';
import { JwtAuthGuard } from './utils/guards/jwt-auth.guard';

// Middleware
import { TenantMiddleware } from './tenant/tenant.middleware';

// Modules
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { TenantModule } from './tenant/tenant.module';
import { TerminalModule } from './terminal/terminal.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';
import { TaxConfigModule } from './tax-config/tax-config.module';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { DiscountModule } from './discount/discount.module';

const typeormConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const host = configService.get(POSTGRES_HOST);
    const port = configService.get(POSTGRES_PORT);

    const database = configService.get(POSTGRES_DB);
    const username = configService.get(POSTGRES_USER);
    const password = configService.get(POSTGRES_PASSWORD);

    return {
      type: 'postgres',
      host: host,
      port: port,
      username: username,
      password: password,
      database: database,
      autoLoadEntities: true,
    };
  },
};

const bullmqConfig: SharedBullAsyncConfiguration = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get(REDIS_HOST);
    const redisPort = configService.get(REDIS_PORT);
    return {
      connection: {
        name: 'bullmq',
        host: redisHost,
        port: redisPort,
      },
    };
  },
};

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync(bullmqConfig),
    TypeOrmModule.forRootAsync(typeormConfig),
    AuthModule,
    UserModule,
    RoleModule,
    SeedModule,
    TenantModule,
    TerminalModule,
    CategoryModule,
    ProductModule,
    CustomerModule,
    OrderModule,
    SyncModule,
    ReportsModule,
    TaxConfigModule,
    FeatureFlagModule,
    DiscountModule,
  ],
  controllers: [],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
