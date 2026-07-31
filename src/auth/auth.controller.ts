import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/utils/guards/local-auth.guard';

import { createResultClass } from 'src/utils/result';
import { convertToInstance } from 'src/utils/dto-validator';

import { LoginDTO } from './dto/login.dto';
import { SafeUserDTO } from 'src/user/dto/safe-user.dto';
import { RefreshTokenDTO } from 'src/auth/dto/refresh-token.dto';

import { Public } from 'src/utils/decorators/is-public.decorator';
import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { TenantId } from 'src/utils/decorators/tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() _: LoginDTO, @Request() req: any) {
    const user = convertToInstance(SafeUserDTO, req.user);
    if (!user.isSuccess) {
      return createResultClass<any, string[]>().error({
        error: user.error,
        errorCode: user.errorCode,
      });
    }
    return await this.authService.login(user.value);
  }

  @Public()
  @ApiTenantHeader()
  @Post('/refresh-token')
  async refreshToken(
    @Body() { refreshToken }: RefreshTokenDTO,
    @TenantId() tenantId: string,
  ) {
    return await this.authService.refreshToken(refreshToken, tenantId);
  }
}
