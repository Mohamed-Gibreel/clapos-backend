import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedTextDTO } from 'src/utils/dto/localized-text.dto';

export class UpdateTaxConfigDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  @IsOptional()
  name?: LocalizedTextDTO;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  rate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
