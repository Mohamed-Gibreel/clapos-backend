import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  Matches,
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

  // POS cashier PIN — separate from the dashboard password, used for
  // terminal-paired cashier logins.
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin?: string;
}
