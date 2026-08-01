import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomerDTO } from 'src/customer/dto/create-customer.dto';

export class SyncCustomersDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerDTO)
  customers: CreateCustomerDTO[];
}
