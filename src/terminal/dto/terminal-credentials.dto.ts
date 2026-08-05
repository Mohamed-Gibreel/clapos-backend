import { Expose } from 'class-transformer';
import { IsBoolean, IsString, IsUUID } from 'class-validator';

// Only response shape that ever carries the plaintext device token — returned
// once, at creation/rotation time. Never built from the raw entity.
@Expose()
export class TerminalCredentialsDTO {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  deviceToken: string;
}
