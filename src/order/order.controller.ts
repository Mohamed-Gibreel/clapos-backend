import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { UserId } from 'src/utils/decorators/user.decorator';
import { OrderService } from './order.service';
import { CreateOrderDTO } from './dto/create-order.dto';
import { SyncOrdersDTO } from './dto/sync-orders.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('orders')
@Role([Roles.Admin, Roles.User])
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDTO, @UserId() cashierId: number) {
    return this.orderService.create(dto, cashierId);
  }

  @Post('sync')
  syncOrders(@Body() dto: SyncOrdersDTO, @UserId() cashierId: number) {
    return this.orderService.syncOrders(dto, cashierId);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('orderType') orderType?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orderService.getAll({
      status,
      orderType,
      paymentMethod,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getById(id);
  }
}
