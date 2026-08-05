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

export class UpdateDiscountDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  @IsOptional()
  name?: LocalizedTextDTO;

  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

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
