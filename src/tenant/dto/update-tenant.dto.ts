import { PartialType } from '@nestjs/swagger';
import { CreateTenantDTO } from './create-tenant.dto';
import { IsString } from 'class-validator';

export class UpdateTenantDTO extends PartialType(CreateTenantDTO) {
  @IsString()
  name: string;
}
