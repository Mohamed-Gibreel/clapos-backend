import { CreateUserDTO } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateUserDTO extends PartialType(CreateUserDTO) {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string | undefined;

  @Min(1)
  @IsNumber()
  @IsOptional()
  roleId?: number | undefined;

  @IsUUID()
  @IsOptional()
  tenantId?: string | undefined;
}
