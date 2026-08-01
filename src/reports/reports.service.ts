import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createResultClass } from 'src/utils/result';
import { TenantRepository } from 'src/utils/decorators/tenant-repository.decorator';
import { TenantScopedRepository } from 'src/tenant/tenant-scoped.repository';
import { TenantContextService } from 'src/tenant/tenant-context.service';
import { ErrorCode } from 'src/utils/error-codes';
import { Order, OrderStatus } from 'src/order/entities/order.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { Product } from 'src/product/entities/product.entity';
import { TerminalEvent } from 'src/event/entities/terminal-event.entity';

@Injectable()
export class ReportsService {
  constructor(
    @TenantRepository(Order)
    private readonly orderRepo: TenantScopedRepository<Order>,
    @TenantRepository(Customer)
    private readonly customerRepo: TenantScopedRepository<Customer>,
    @TenantRepository(Product)
    private readonly productRepo: TenantScopedRepository<Product>,
    @InjectRepository(TerminalEvent)
    private readonly terminalEventRepo: Repository<TerminalEvent>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getSummary(query: { from?: string; to?: string; terminalId?: string; eventId?: string }) {
    const Result = createResultClass<any, string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const from = query.from ? new Date(query.from) : this.startOfDay(new Date());
      const to = query.to ? new Date(query.to) : new Date();

      const terminalIds = await this.resolveTerminalIds(query.terminalId, query.eventId, tenantId);
      if (terminalIds !== null && terminalIds.length === 0) {
        return Result.success(this.emptySummary(from, to));
      }

      const orderQb = this.orderRepo
        .createQueryBuilder('order')
        .innerJoin('order.tenant', 'tenant')
        .where('tenant.id = :tenantId', { tenantId })
        .andWhere('order.deletedAt IS NULL')
        .andWhere('order.status != :cancelled', { cancelled: OrderStatus.Cancelled })
        .andWhere('order.clientCreatedAt BETWEEN :from AND :to', { from, to });

      if (terminalIds !== null) {
        orderQb.andWhere('order.terminalId IN (:...terminalIds)', { terminalIds });
      }

      const orders = await orderQb.getMany();
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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

  async getSales(query: { from?: string; to?: string; groupBy?: 'day' | 'week' | 'month'; terminalId?: string; eventId?: string }) {
    const Result = createResultClass<any[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const from = query.from ? new Date(query.from) : this.startOfDay(new Date());
      const to = query.to ? new Date(query.to) : new Date();
      const groupBy = query.groupBy ?? 'day';

      const terminalIds = await this.resolveTerminalIds(query.terminalId, query.eventId, tenantId);
      if (terminalIds !== null && terminalIds.length === 0) return Result.success([]);

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

      if (terminalIds !== null) {
        qb.andWhere('order.terminalId IN (:...terminalIds)', { terminalIds });
      }

      const rows = await qb.getRawMany();
      return Result.success(rows.map((r) => ({
        period: r.period,
        totalOrders: parseInt(r.totalOrders, 10),
        totalRevenue: Number(Number(r.totalRevenue).toFixed(2)),
      })));
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getTopProducts(query: { from?: string; to?: string; limit?: number; terminalId?: string; eventId?: string }) {
    const Result = createResultClass<any[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const from = query.from ? new Date(query.from) : this.startOfDay(new Date());
      const to = query.to ? new Date(query.to) : new Date();
      const limit = Math.min(query.limit ?? 10, 50);

      const terminalIds = await this.resolveTerminalIds(query.terminalId, query.eventId, tenantId);
      if (terminalIds !== null && terminalIds.length === 0) return Result.success([]);

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

      if (terminalIds !== null) {
        qb.andWhere('order.terminalId IN (:...terminalIds)', { terminalIds });
      }

      const rows = await qb.getRawMany();
      return Result.success(rows.map((r) => ({
        productId: r.productId,
        name: r.name,
        quantitySold: parseInt(r.quantitySold, 10),
        totalRevenue: Number(Number(r.totalRevenue).toFixed(2)),
      })));
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
      for (const row of rows) counts[row.status] = parseInt(row.count, 10);

      return Result.success(counts);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async getRecentOrders(query: { limit?: number; terminalId?: string; eventId?: string }) {
    const Result = createResultClass<Order[], string[]>();
    try {
      const tenantId = this.tenantContext.getTenantId();
      const limit = Math.min(query.limit ?? 5, 50);

      const terminalIds = await this.resolveTerminalIds(query.terminalId, query.eventId, tenantId);
      if (terminalIds !== null && terminalIds.length === 0) return Result.success([]);

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

      if (terminalIds !== null) {
        qb.andWhere('order.terminalId IN (:...terminalIds)', { terminalIds });
      }

      return Result.success(await qb.getMany());
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  /**
   * Resolves a list of terminal IDs to scope report queries.
   * - If both terminalId and eventId are null → returns null (no filter, show all)
   * - If terminalId is set → returns [terminalId]
   * - If eventId is set → returns all terminal IDs for that event scoped to this tenant
   * - Returns [] if eventId has no terminals for this tenant (caller should return empty result)
   */
  private async resolveTerminalIds(
    terminalId: string | undefined,
    eventId: string | undefined,
    tenantId: string,
  ): Promise<string[] | null> {
    if (terminalId) return [terminalId];

    if (eventId) {
      const rows = await this.terminalEventRepo
        .createQueryBuilder('te')
        .innerJoin('te.terminal', 'terminal')
        .innerJoin('terminal.tenant', 'tenant')
        .select('te.terminalId', 'terminalId')
        .where('te.eventId = :eventId', { eventId })
        .andWhere('tenant.id = :tenantId', { tenantId })
        .getRawMany();
      return rows.map((r) => r.terminalId);
    }

    return null;
  }

  private emptySummary(from: Date, to: Date) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
      newCustomers: 0,
      paymentBreakdown: { cash: { count: 0, revenue: 0 }, card: { count: 0, revenue: 0 } },
      period: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
