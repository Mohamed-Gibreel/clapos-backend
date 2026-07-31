import { IsJWT } from 'class-validator';

export class RefreshTokenDTO {
  @IsJWT()
  refreshToken: string;
}
