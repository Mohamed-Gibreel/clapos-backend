import { Expose, Type } from 'class-transformer';
import { User } from '../entities/user.entity';
import { IsEmail, IsNumber, IsObject, IsString } from 'class-validator';
import { Role } from 'src/role/entities/role.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';

@Expose()
export class SafeUserDTO
  implements
    Omit<
      User,
      'password' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'last_login_at'
    >
{
  @IsNumber()
  id: number;

  @IsEmail()
  emailAddress: string;

  @IsObject()
  @Type(() => Role)
  role: Role;

  @IsObject()
  @Type(() => Tenant)
  tenant: Tenant;

  @IsString()
  name: string;
}
