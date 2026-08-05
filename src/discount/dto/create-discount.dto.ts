import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedTextDTO } from 'src/utils/dto/localized-text.dto';
import { DiscountType } from '../entities/discount.entity';

export class CreateDiscountDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
