import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTerminalDTO {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
