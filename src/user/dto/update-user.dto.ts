import { CreateUserDTO } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateUserDTO extends PartialType(CreateUserDTO) {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string | undefined;

  @IsUUID()
  @IsOptional()
  roleId?: string | undefined;

  @IsUUID()
  @IsOptional()
  tenantId?: string | undefined;
}
