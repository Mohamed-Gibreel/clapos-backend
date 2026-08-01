import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RefundOrderDTO {
  @IsNumber()
  @Min(0.01)
  refundAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
