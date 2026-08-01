import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { Role, Roles } from 'src/utils/decorators/roles.decorator';
import { CustomerService } from './customer.service';
import { MembershipService } from './membership.service';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { UpdateCustomerDTO } from './dto/update-customer.dto';
import { CreateMembershipDTO } from './dto/create-membership.dto';
import { UpdateMembershipDTO } from './dto/update-membership.dto';

@ApiBearerAuth()
@ApiTenantHeader()
@Controller('customers')
@Role([Roles.Cashier, Roles.Manager, Roles.Owner])
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly membershipService: MembershipService,
  ) {}

  @Post()
  create(@Body() dto: CreateCustomerDTO) {
    return this.customerService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('isMember') isMember?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerService.getAll({
      search,
      isMember: isMember !== undefined ? isMember === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDTO) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @Role([Roles.Manager, Roles.Owner])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.remove(id);
  }

  @Get(':id/membership')
  getMembership(@Param('id', ParseUUIDPipe) id: string) {
    return this.membershipService.getForCustomer(id);
  }

  @Post(':id/membership')
  @Role([Roles.Manager, Roles.Owner])
  createMembership(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateMembershipDTO) {
    return this.membershipService.create(id, dto);
  }

  @Patch(':id/membership')
  @Role([Roles.Manager, Roles.Owner])
  updateMembership(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMembershipDTO) {
    return this.membershipService.update(id, dto);
  }
}
