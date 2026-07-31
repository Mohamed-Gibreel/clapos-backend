import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from '../../auth/auth.service';
import { SafeUserDTO } from 'src/user/dto/safe-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'name',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, username: string, password: string): Promise<SafeUserDTO> {
    const tenantId = (req as any).tenantId;
    const user = await this.authService.validateUser(username, password, tenantId);
    if (!user) {
      throw new BadRequestException();
    }
    return user;
  }
}
