import { IsNotEmpty, IsString } from 'class-validator';

import { User } from '../entities/user.entity';

export class FindUserDTO implements Pick<User, 'name' | 'password'> {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
