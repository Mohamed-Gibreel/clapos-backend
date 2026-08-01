import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { TenantContextService } from 'src/tenant/tenant-context.service';
import { ErrorCode } from 'src/utils/error-codes';
import { ProductService } from 'src/product/product.service';
import { CustomerService } from 'src/customer/customer.service';
import { TerminalService } from 'src/terminal/terminal.service';
import { UserService } from 'src/user/user.service';
import { TaxConfigService } from 'src/tax-config/tax-config.service';

import { Customer } from 'src/customer/entities/customer.entity';
import { PosTerminal } from 'src/terminal/entities/terminal.entity';
import { Order, DiscountType, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemVariation } from './entities/order-item-variation.entity';
import { CreateOrderDTO } from './dto/create-order.dto';
import { SyncOrdersDTO } from './dto/sync-orders.dto';
import { VoidOrderDTO } from './dto/void-order.dto';
import { RefundOrderDTO } from './dto/refund-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @TenantRepository(Order)
    private readonly orderRepo: TenantScopedRepository<Order>,
    private readonly tenantContext: TenantContextService,
    private readonly productService: ProductService,
    private readonly customerService: CustomerService,
    private readonly terminalService: TerminalService,
    private readonly userService: UserService,
    private readonly taxConfigService: TaxConfigService,
  ) {}

  async create(dto: CreateOrderDTO, cashierId: string) {
    const Result = createResultClass<Order, string[]>();
    try {
      const isValid = convertToInstance(CreateOrderDTO, dto);
      if (!isValid.isSuccess) {
        return Result.error({ error: isValid.error, errorCode: HttpStatus.BAD_REQUEST });
      }

      const v = isValid.value;
      const clientId = v.clientId ?? randomUUID();

      // Idempotency: return existing if clientId already used
      const existing = await this.orderRepo.findOne({ where: { clientId }, relations: ['items', 'items.variations', 'customer', 'terminal', 'cashier'] });
      if (existing) return Result.success(existing);

      return this.buildAndSaveOrder(v, clientId, cashierId, false);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async syncOrders(dto: SyncOrdersDTO, cashierId: string) {
    type SyncResult = { clientId: string; serverId: string | null; orderNumber: string | null; status: string; error?: string };
    const Result = createResultClass<{ results: SyncResult[] }, string[]>();
    const results: SyncResult[] = [];

    // Process in clientCreatedAt order
    const sorted = [...dto.orders].sort(
      (a, b) => new Date(a.clientCreatedAt ?? 0).getTime() - new Date(b.clientCreatedAt ?? 0).getTime(),
    );

    for (const orderDto of sorted) {
      const clientId = orderDto.clientId ?? randomUUID();
      try {
        // Idempotency check
        const existing = await this.orderRepo.findOne({ where: { clientId } });
        if (existing) {
          results.push({ clientId, serverId: existing.id, orderNumber: existing.orderNumber ?? null, status: 'already_exists' });
          continue;
        }

        const saved = await this.buildAndSaveOrder(orderDto, clientId, cashierId, true);
        if (!saved.isSuccess) {
          results.push({ clientId, serverId: null, orderNumber: null, status: 'failed', error: saved.error?.join(', ') });
        } else {
          results.push({ clientId, serverId: saved.value.id, orderNumber: saved.value.orderNumber ?? null, status: 'created' });
        }
      } catch (error) {
        results.push({ clientId, serverId: null, orderNumber: null, status: 'failed', error: ErrorCode.INTERNAL_SERVER_ERROR });
      }
    }

    return Result.success({ results });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const Result = createResultClass<Order, string[]>();
    try {
      const order = await this.orderRepo.findOne({ where: { id } });
      if (!order) {
        return Result.error({ error: [ErrorCode.ORDER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      await this.orderRepo.update({ id }, { status });
      order.status = status;
      return Result.success(order);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async void(id: string, dto: VoidOrderDTO) {
    const Result = createResultClass<Order, string[]>();
    try {
      const order = await this.orderRepo.findOne({ where: { id } });
      if (!order) {
        return Result.error({ error: [ErrorCode.ORDER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      const voidableStatuses: OrderStatus[] = [OrderStatus.Open, OrderStatus.InProgress, OrderStatus.Completed];
      if (!voidableStatuses.includes(order.status)) {
        return Result.error({ error: [ErrorCode.ORDER_CANNOT_BE_VOIDED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      await this.orderRepo.update({ id }, { status: OrderStatus.Voided, reason: dto.reason });
      order.status = OrderStatus.Voided;
      order.reason = dto.reason;
      return Result.success(order);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async refund(id: string, dto: RefundOrderDTO) {
    const Result = createResultClass<Order, string[]>();
    try {
      const order = await this.orderRepo.findOne({ where: { id } });
      if (!order) {
        return Result.error({ error: [ErrorCode.ORDER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      if (order.status !== OrderStatus.Completed) {
        return Result.error({ error: [ErrorCode.ORDER_CANNOT_BE_REFUNDED], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      if (dto.refundAmount > Number(order.total)) {
        return Result.error({ error: [ErrorCode.REFUND_AMOUNT_EXCEEDS_TOTAL], errorCode: HttpStatus.UNPROCESSABLE_ENTITY });
      }
      await this.orderRepo.update({ id }, { status: OrderStatus.Refunded, refundAmount: dto.refundAmount, reason: dto.reason });
      order.status = OrderStatus.Refunded;
      order.refundAmount = dto.refundAmount;
      order.reason = dto.reason;
      return Result.success(order);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  private async buildAndSaveOrder(v: CreateOrderDTO, clientId: string, cashierId: string, isOffline: boolean) {
    const Result = createResultClass<Order, string[]>();

    // Resolve cashier
    const cashierRes = await this.userService.findOne({ where: { id: cashierId } });
    if (!cashierRes.isSuccess) {
      return Result.error({ error: [ErrorCode.CASHIER_NOT_FOUND], errorCode: HttpStatus.BAD_REQUEST });
    }

    // Resolve optional customer
    let customer: Customer | null = null;
    if (v.customerId) {
      const custRes = await this.customerService.findOne({ where: { id: v.customerId } });
      if (custRes.isSuccess) customer = custRes.value;
    }

    // Resolve optional terminal
    let terminal: PosTerminal | null = null;
    if (v.terminalId) {
      const termRes = await this.terminalService.findOne({ where: { id: v.terminalId } });
      if (termRes.isSuccess) terminal = termRes.value;
    }

    // Build order items
    let hadOfflineConflict = false;
    const orderItems: OrderItem[] = [];

    for (const itemDto of v.items) {
      const item = new OrderItem();
      item.productId = itemDto.productId ?? undefined;
      item.quantity = itemDto.quantity;
      item.notes = itemDto.notes;

      if (isOffline) {
        // Trust client-submitted prices for offline orders
        item.name = itemDto.name;
        item.unitPrice = itemDto.unitPrice;

        // Check if product still exists (informational only)
        if (itemDto.productId) {
          const prodRes = await this.productService.findOne({ where: { id: itemDto.productId } });
          if (!prodRes.isSuccess) hadOfflineConflict = true;
        }
      } else {
        // Re-price server-side for online orders
        if (itemDto.productId) {
          const prodRes = await this.productService.findOne({ where: { id: itemDto.productId } });
          if (!prodRes.isSuccess) {
            return Result.error({ error: [ErrorCode.PRODUCT_NOT_FOUND], errorCode: HttpStatus.BAD_REQUEST });
          }
          item.name = prodRes.value.name;
          item.unitPrice = Number(prodRes.value.price);
        } else {
          // One-off item
          item.name = itemDto.name;
          item.unitPrice = itemDto.unitPrice;
        }
      }

      // Variation price modifier total
      const variationTotal = (itemDto.variations ?? []).reduce((sum, v) => sum + (v.priceModifier ?? 0), 0);
      item.subtotal = (item.unitPrice + variationTotal) * item.quantity;

      item.variations = (itemDto.variations ?? []).map((vd) => {
        const iv = new OrderItemVariation();
        iv.groupName = vd.groupName;
        iv.optionName = vd.optionName;
        iv.priceModifier = vd.priceModifier ?? 0;
        return iv;
      });

      orderItems.push(item);
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, i) => sum + Number(i.subtotal), 0);
    const discountType = v.discountType ?? DiscountType.None;
    const discountValue = v.discountValue ?? 0;
    let discountAmount = 0;
    if (discountType === DiscountType.Percentage) {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === DiscountType.Amount) {
      discountAmount = discountValue;
    }
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxConfigRes = await this.taxConfigService.getActive();
    const taxRate = taxConfigRes.isSuccess && taxConfigRes.value ? Number(taxConfigRes.value.rate) : 0;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;
    const change = Math.max(0, v.amountPaid - total);

    const order = this.orderRepo.create();
    order.clientId = clientId;
    order.orderNumber = this.generateOrderNumber();
    order.status = OrderStatus.Completed;
    order.orderType = v.orderType;
    order.discountType = discountType;
    order.discountValue = discountValue;
    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;
    order.paymentMethod = v.paymentMethod;
    order.amountPaid = v.amountPaid;
    order.change = change;
    order.notes = v.notes;
    order.clientCreatedAt = v.clientCreatedAt ? new Date(v.clientCreatedAt) : new Date();
    order.hadOfflineConflict = hadOfflineConflict;
    order.cashier = cashierRes.value;
    order.customer = customer;
    order.terminal = terminal;
    order.items = orderItems;

    const saved = await this.orderRepo.saveWithTenant(order);
    return Result.success(saved);
  }

  async getAll(query: {
    status?: string;
    orderType?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const Result = createResultClass<{ data: Order[]; total: number }, string[]>();
    try {
      const page = query.page ?? 1;
      const limit = Math.min(query.limit ?? 20, 100);
      const skip = (page - 1) * limit;

      const qb = this.orderRepo
        .createQueryBuilder('order')
        .innerJoin('order.tenant', 'tenant')
        .leftJoinAndSelect('order.items', 'item')
        .leftJoinAndSelect('item.variations', 'variation')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.terminal', 'terminal')
        .leftJoinAndSelect('order.cashier', 'cashier')
        .where('tenant.id = :tenantId', { tenantId: this.tenantContext.getTenantId() })
        .andWhere('order.deletedAt IS NULL')
        .orderBy('order.clientCreatedAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (query.status) qb.andWhere('order.status = :status', { status: query.status });
      if (query.orderType) qb.andWhere('order.orderType = :orderType', { orderType: query.orderType });
      if (query.paymentMethod) qb.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
      if (query.dateFrom) qb.andWhere('order.clientCreatedAt >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
      if (query.dateTo) qb.andWhere('order.clientCreatedAt <= :dateTo', { dateTo: new Date(query.dateTo) });

      const [data, total] = await qb.getManyAndCount();
      return Result.success({ data, total });
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getById(id: string) {
    const Result = createResultClass<Order, string[]>();
    try {
      const order = await this.orderRepo.findOne({
        where: { id },
        relations: ['items', 'items.variations', 'customer', 'terminal', 'cashier'],
      });
      if (!order) {
        return Result.error({ error: [ErrorCode.ORDER_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(order);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  private generateOrderNumber(): string {
    const prefix = 'PZ';
    const random = Math.floor(10000000 + Math.random() * 90000000);
    return `${prefix}${random}`;
  }
}
