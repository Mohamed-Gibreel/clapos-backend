import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsStrongPassword,
  IsUUID,
  Min,
} from 'class-validator';

import { User } from '../entities/user.entity';

export class CreateUserDTO
  implements Pick<User, 'name' | 'emailAddress' | 'password'>
{
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Min(1)
  @IsNumber()
  roleId: number;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
