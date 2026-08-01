import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntityModule } from 'src/tenant/tenant-entity.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { ProductModule } from 'src/product/product.module';
import { CustomerModule } from 'src/customer/customer.module';
import { TerminalModule } from 'src/terminal/terminal.module';
import { UserModule } from 'src/user/user.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemVariation } from './entities/order-item-variation.entity';

@Module({
  imports: [
    TenantEntityModule.forFeature([Order]),
    TypeOrmModule.forFeature([OrderItem, OrderItemVariation]),
    TenantModule,
    ProductModule,
    CustomerModule,
    TerminalModule,
    UserModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
