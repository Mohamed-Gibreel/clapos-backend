import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
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

  @IsUUID()
  roleId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
