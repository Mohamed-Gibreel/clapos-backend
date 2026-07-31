import { IsJWT } from 'class-validator';
import { SafeUserDTO } from './safe-user.dto';
import { Expose } from 'class-transformer';

@Expose()
export class LoggedInUser extends SafeUserDTO {
  @IsJWT()
  accessToken: string;

  @IsJWT()
  refreshToken: string;
}
