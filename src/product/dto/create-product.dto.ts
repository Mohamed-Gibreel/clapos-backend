import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedTextDTO } from 'src/utils/dto/localized-text.dto';
import { ProductStatus } from '../entities/product.entity';

export class CreateVariationOptionDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceModifier?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class CreateVariationGroupDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxSelect?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariationOptionDTO)
  options: CreateVariationOptionDTO[];
}

export class CreateProductDTO {
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  @IsOptional()
  description?: LocalizedTextDTO;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

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
  @Type(() => CreateVariationGroupDTO)
  @IsOptional()
  variationGroups?: CreateVariationGroupDTO[];
}
