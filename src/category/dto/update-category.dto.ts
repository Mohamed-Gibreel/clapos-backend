import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedTextDTO } from 'src/utils/dto/localized-text.dto';

export class UpdateCategoryDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  @IsOptional()
  name?: LocalizedTextDTO;

  @IsUUID()
  @IsOptional()
  iconId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
