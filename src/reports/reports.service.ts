import { HttpStatus, Injectable } from '@nestjs/common';
import { createResultClass } from 'src/utils/result';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { TenantContextService } from 'src/tenant/tenant-context.service';
import { ErrorCode } from 'src/utils/error-codes';
import { Order, OrderStatus } from 'src/order/entities/order.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class ReportsService {
  constructor(
    @TenantRepository(Order)
    private readonly orderRepo: TenantScopedRepository<Order>,
    @TenantRepository(Customer)
    private readonly customerRepo: TenantScopedRepository<Customer>,
    @TenantRepository(Product)
    private readonly productRepo: TenantScopedRepository<Product>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getSummary(query: {
    from?: string;
    to?: string;
    terminalId?: string;
  }) {
    const Result = createResultClass<any, string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const from = query.from ? new Date(query.from) : this.startOfDay(new Date());
      const to = query.to ? new Date(query.to) : new Date();

      const orderQb = this.orderRepo
        .createQueryBuilder('order')
        .innerJoin('order.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId })
        .andWhere('order.deletedAt IS NULL')
        .andWhere('order.status != :cancelled', { cancelled: OrderStatus.Cancelled })
        .andWhere('order.clientCreatedAt BETWEEN :from AND :to', { from, to });

      if (query.terminalId) {
        orderQb.andWhere('order.terminal = :terminalId', { terminalId: query.terminalId });
      }

      const orders = await orderQb.getMany();

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Customer counts
      const customerQb = this.customerRepo
        .createQueryBuilder('customer')
        .innerJoin('customer.tenant', 'ctenant')
        .where('ctenant.id = :tenantId', { tenantId })
        .andWhere('customer.deletedAt IS NULL');

      const totalCustomers = await customerQb.getCount();

      const newCustomersQb = this.customerRepo
        .createQueryBuilder('customer')
        .innerJoin('customer.tenant', 'ctenant2')
        .where('ctenant2.id = :tenantId', { tenantId })
        .andWhere('customer.deletedAt IS NULL')
        .andWhere('customer.createdAt BETWEEN :from AND :to', { from, to });

      const newCustomers = await newCustomersQb.getCount();

      // Payment method breakdown
      const cashOrders = orders.filter((o) => o.paymentMethod === 'cash');
      const cardOrders = orders.filter((o) => o.paymentMethod === 'card');

      return Result.success({
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        totalCustomers,
        newCustomers,
        paymentBreakdown: {
          cash: { count: cashOrders.length, revenue: Number(cashOrders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)) },
          card: { count: cardOrders.length, revenue: Number(cardOrders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)) },
        },
        period: { from: from.toISOString(), to: to.toISOString() },
      });
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getSales(query: {
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
    terminalId?: string;
  }) {
    const Result = createResultClass<any[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const from = query.from ? new Date(query.from) : this.startOfDay(new Date());
      const to = query.to ? new Date(query.to) : new Date();
      const groupBy = query.groupBy ?? 'day';

      const qb = this.orderRepo
        .createQueryBuilder('order')
        .innerJoin('order.tenant', 'tenant')
        .select(`DATE_TRUNC('${groupBy}', order.clientCreatedAt)`, 'period')
        .addSelect('COUNT(order.id)', 'totalOrders')
        .addSelect('SUM(order.total)', 'totalRevenue')
        .where('tenant.id = :tenantId', { tenantId })
        .andWhere('order.deletedAt IS NULL')
        .andWhere('order.status != :cancelled', { cancelled: OrderStatus.Cancelled })
        .andWhere('order.clientCreatedAt BETWEEN :from AND :to', { from, to })
        .groupBy(`DATE_TRUNC('${groupBy}', order.clientCreatedAt)`)
        .orderBy('period', 'ASC');

      if (query.terminalId) {
        qb.andWhere('order.terminal = :terminalId', { terminalId: query.terminalId });
      }

      const rows = await qb.getRawMany();
      const data = rows.map((r) => ({
        period: r.period,
        totalOrders: parseInt(r.totalOrders, 10),
        totalRevenue: Number(Number(r.totalRevenue).toFixed(2)),
      }));

      return Result.success(data);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getTopProducts(query: {
    from?: string;
    to?: string;
    limit?: number;
    terminalId?: string;
  }) {
    const Result = createResultClass<any[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const from = query.from ? new Date(query.from) : this.startOfDay(new Date());
      const to = query.to ? new Date(query.to) : new Date();
      const limit = Math.min(query.limit ?? 10, 50);

      const qb = this.orderRepo
        .createQueryBuilder('order')
        .innerJoin('order.tenant', 'tenant')
        .innerJoin('order.items', 'item')
        .select('item.productId', 'productId')
        .addSelect('item.name', 'name')
        .addSelect('SUM(item.quantity)', 'quantitySold')
        .addSelect('SUM(item.subtotal)', 'totalRevenue')
        .where('tenant.id = :tenantId', { tenantId })
        .andWhere('order.deletedAt IS NULL')
        .andWhere('order.status != :cancelled', { cancelled: OrderStatus.Cancelled })
        .andWhere('item.productId IS NOT NULL')
        .andWhere('order.clientCreatedAt BETWEEN :from AND :to', { from, to })
        .groupBy('item.productId')
        .addGroupBy('item.name')
        .orderBy('"quantitySold"', 'DESC')
        .limit(limit);

      if (query.terminalId) {
        qb.andWhere('order.terminal = :terminalId', { terminalId: query.terminalId });
      }

      const rows = await qb.getRawMany();
      const data = rows.map((r) => ({
        productId: r.productId,
        name: r.name,
        quantitySold: parseInt(r.quantitySold, 10),
        totalRevenue: Number(Number(r.totalRevenue).toFixed(2)),
      }));

      return Result.success(data);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getProductStatus() {
    const Result = createResultClass<any, string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();

      const rows = await this.productRepo
        .createQueryBuilder('product')
        .innerJoin('product.tenant', 'tenant')
        .select('product.status', 'status')
        .addSelect('COUNT(product.id)', 'count')
        .where('tenant.id = :tenantId', { tenantId })
        .andWhere('product.deletedAt IS NULL')
        .groupBy('product.status')
        .getRawMany();

      const counts: Record<string, number> = { active: 0, inactive: 0, draft: 0 };
      for (const row of rows) {
        counts[row.status] = parseInt(row.count, 10);
      }

      return Result.success(counts);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getRecentOrders(query: { limit?: number; terminalId?: string }) {
    const Result = createResultClass<Order[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const limit = Math.min(query.limit ?? 5, 50);

      const qb = this.orderRepo
        .createQueryBuilder('order')
        .innerJoin('order.tenant', 'tenant')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.terminal', 'terminal')
        .leftJoinAndSelect('order.cashier', 'cashier')
        .where('tenant.id = :tenantId', { tenantId })
        .andWhere('order.deletedAt IS NULL')
        .orderBy('order.clientCreatedAt', 'DESC')
        .take(limit);

      if (query.terminalId) {
        qb.andWhere('order.terminal = :terminalId', { terminalId: query.terminalId });
      }

      const orders = await qb.getMany();
      return Result.success(orders);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
