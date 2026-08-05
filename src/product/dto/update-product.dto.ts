import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedTextDTO } from 'src/utils/dto/localized-text.dto';
import { ProductStatus } from '../entities/product.entity';
import {
  CreateVariationGroupDTO,
  CreateVariationOptionDTO,
} from './create-product.dto';

export class UpdateVariationOptionDTO extends CreateVariationOptionDTO {
  @IsUUID()
  @IsOptional()
  id?: string;
}

export class UpdateVariationGroupDTO extends CreateVariationGroupDTO {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariationOptionDTO)
  declare options: UpdateVariationOptionDTO[];
}

export class UpdateProductDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  @IsOptional()
  name?: LocalizedTextDTO;

  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  @IsOptional()
  description?: LocalizedTextDTO;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsUUID()
  @IsOptional()
  imageId?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariationGroupDTO)
  @IsOptional()
  variationGroups?: UpdateVariationGroupDTO[];
}
