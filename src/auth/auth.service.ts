import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserService } from 'src/user/user.service';
import { SafeUserDTO } from 'src/user/dto/safe-user.dto';
import { createResultClass } from 'src/utils/result';
import { LoggedInUser } from 'src/user/dto/logged-in-user.dto';
import { convertToInstance } from 'src/utils/dto-validator';
import { JwtService } from '@nestjs/jwt';
import { deriveTenantSecret } from 'src/utils/get-tenant-secret';
import { ErrorCode } from 'src/utils/error-codes';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
    tenantId: string,
  ): Promise<SafeUserDTO | null> {
    const user = await this.userService.findByName({ name: username, tenantId });
    if (!user.isSuccess) return null;

    const isPasswordValid = await bcrypt.compare(password, user.value.password);
    if (!isPasswordValid) return null;

    const safeUser = convertToInstance(SafeUserDTO, user.value);
    if (!safeUser.isSuccess) return null;
    return safeUser.value;
  }

  async login(user: SafeUserDTO) {
    const Result = createResultClass<LoggedInUser, string[]>();
    try {
      const payload = {
        sub: user.id,
        username: user.name,
        roleId: user.role.id,
      };

      const loginRes = await this.userService.login(user.id);
      if (!loginRes.isSuccess) {
        return Result.error({ error: loginRes.error, errorCode: loginRes.errorCode });
      }

      const tenantSecret = deriveTenantSecret(loginRes.value.tenant.id);

      const accessToken = this.jwtService.sign(payload, { secret: tenantSecret });
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '2h',
        secret: tenantSecret,
      });

      const loggedInUser = convertToInstance(LoggedInUser, {
        ...loginRes.value,
        accessToken,
        refreshToken,
      });

      if (!loggedInUser.isSuccess) {
        return Result.error({
          error: [ErrorCode.USER_SERIALIZATION_FAILED],
          errorCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
      return Result.success(loggedInUser.value);
    } catch (e) {
      return Result.error({ errorCode: HttpStatus.INTERNAL_SERVER_ERROR, error: e });
    }
  }

  async refreshToken(token: string, tenantId: string) {
    const Result = createResultClass<any, string[]>();
    try {
      const isTokenValid = this.verifyRefreshToken(token, tenantId);
      if (!isTokenValid.isSuccess) {
        return Result.error({ error: [ErrorCode.INVALID_TOKEN], errorCode: HttpStatus.UNAUTHORIZED });
      }

      const decodedToken = this.decodeToken(token);
      if (!decodedToken.isSuccess) {
        return Result.error({ error: [decodedToken.error], errorCode: HttpStatus.UNAUTHORIZED });
      }

      const user = await this.userService.findOne({
        where: { id: decodedToken.value.sub },
        relations: ['role', 'tenant'],
      });

      if (!user.isSuccess) {
        return Result.error({ error: [user.error], errorCode: HttpStatus.UNAUTHORIZED });
      }

      const loggedInUser = await this.login(user.value);
      if (!loggedInUser.isSuccess) {
        return Result.error({ error: loggedInUser.error, errorCode: HttpStatus.UNAUTHORIZED });
      }

      return Result.success(loggedInUser.value);
    } catch (error) {
      return Result.error({ error, errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  decodeToken(token: string) {
    const Result = createResultClass<{ username: string; sub: string }, string>();
    try {
      const value = this.jwtService.decode(token);
      if (value == null) {
        return Result.error({ error: ErrorCode.INVALID_TOKEN, errorCode: HttpStatus.UNAUTHORIZED });
      }
      return Result.success(value);
    } catch (error) {
      return Result.error({ error, errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  verifyRefreshToken(token: string, tenantId: string) {
    const Result = createResultClass<boolean, string>();
    try {
      this.jwtService.verify(token, {
        ignoreExpiration: true,
        secret: deriveTenantSecret(tenantId),
      });
      return Result.success(true);
    } catch (error) {
      return Result.error({ error, errorCode: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
}
