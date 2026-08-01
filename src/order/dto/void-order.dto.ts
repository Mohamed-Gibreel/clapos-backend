import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VoidOrderDTO {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
