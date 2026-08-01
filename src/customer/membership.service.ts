import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { createResultClass } from 'src/utils/result';
import { ErrorCode } from 'src/utils/error-codes';

import { Membership } from './entities/membership.entity';
import { Customer } from './entities/customer.entity';
import { CreateMembershipDTO } from './dto/create-membership.dto';
import { UpdateMembershipDTO } from './dto/update-membership.dto';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async getForCustomer(customerId: string) {
    const Result = createResultClass<Membership, string[]>();
    try {
      const membership = await this.membershipRepo.findOne({ where: { customerId } });
      if (!membership) {
        return Result.error({ error: [ErrorCode.MEMBERSHIP_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }
      return Result.success(membership);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(customerId: string, dto: CreateMembershipDTO) {
    const Result = createResultClass<Membership, string[]>();
    try {
      const existing = await this.membershipRepo.findOne({ where: { customerId } });
      if (existing) {
        return Result.error({ error: [ErrorCode.MEMBERSHIP_ALREADY_EXISTS], errorCode: HttpStatus.CONFLICT });
      }

      const membership = this.membershipRepo.create({
        customerId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        isActive: dto.isActive ?? true,
      });
      const saved = await this.membershipRepo.save(membership);

      await this.customerRepo.update({ id: customerId }, { isMember: true });

      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async update(customerId: string, dto: UpdateMembershipDTO) {
    const Result = createResultClass<Membership, string[]>();
    try {
      const existing = await this.membershipRepo.findOne({ where: { customerId } });
      if (!existing) {
        return Result.error({ error: [ErrorCode.MEMBERSHIP_NOT_FOUND], errorCode: HttpStatus.NOT_FOUND });
      }

      const merged = this.membershipRepo.merge(existing, {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate,
      });
      const saved = await this.membershipRepo.save(merged);

      if (dto.isActive !== undefined) {
        await this.customerRepo.update({ id: customerId }, { isMember: dto.isActive });
      }

      return Result.success(saved);
    } catch (error) {
      return Result.error({ error: [ErrorCode.INTERNAL_SERVER_ERROR], errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
