import { Controller, Post, Body } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginDTO } from './dto/login.dto';
import { RefreshTokenDTO } from 'src/auth/dto/refresh-token.dto';
import { TerminalLoginDTO } from 'src/auth/dto/terminal-login.dto';
import { CashierLoginDTO } from 'src/auth/dto/cashier-login.dto';

import { Public } from 'src/utils/decorators/is-public.decorator';
import { ApiTenantHeader } from 'src/utils/decorators/tenant-header.decorator';
import { TenantId } from 'src/utils/decorators/tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/login')
  async login(
    @Body() { name, password }: LoginDTO,
    @TenantId() tenantId: string,
  ) {
    const userResult = await this.authService.validateUser(
      name,
      password,
      tenantId,
    );
    if (!userResult.isSuccess) {
      return userResult;
    }
    return await this.authService.login(userResult.value);
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

  // No x-tenant-id — the device token alone resolves the tenant.
  @Public()
  @Post('/terminal-login')
  async terminalLogin(@Body() { deviceToken }: TerminalLoginDTO) {
    return await this.authService.terminalLogin(deviceToken);
  }

  @Public()
  @ApiTenantHeader()
  @Post('/cashier-login')
  async cashierLogin(
    @Body() { terminalToken, userId, pin }: CashierLoginDTO,
    @TenantId() tenantId: string,
  ) {
    return await this.authService.cashierLogin(
      terminalToken,
      userId,
      pin,
      tenantId,
    );
  }
}
