import { IsEnum, IsHexColor, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TableShape, TableStatus } from '../entities/table.entity';

export class CreateTableDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TableShape)
  shape: TableShape;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @IsNumber()
  posX: number;

  @IsNumber()
  posY: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsHexColor()
  color: string;
}
