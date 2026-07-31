import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';

import { AuthService } from '../../auth/auth.service';
import { SafeUserDTO } from 'src/user/dto/safe-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'name',
    });
  }

  async validate(username: string, password: string): Promise<SafeUserDTO> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new BadRequestException();
    }
    return user;
  }
}
