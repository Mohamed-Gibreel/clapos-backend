import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFeatureFlagDTO {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
