import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureFlagDTO {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
