import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

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
