import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { deriveTenantSecret } from '../get-tenant-secret';
import { ErrorCode } from '../error-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (req: Request, _, done) => {
        const tenantId = req.headers['x-tenant-id'];

        if (!tenantId || typeof tenantId !== 'string') {
          return done(
            new UnauthorizedException(ErrorCode.MISSING_TENANT_ID),
          );
        }

        // Fetch the tenant secret dynamically — replace with real lookup
        const tenantSecret = deriveTenantSecret(tenantId);

        if (!tenantSecret) {
          return done(new UnauthorizedException(ErrorCode.INVALID_TENANT));
        }

        return done(null, tenantSecret);
      },
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      roleId: payload.roleId,
      username: payload.username,
    };
  }
}
