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

export class CreateTaxConfigDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
