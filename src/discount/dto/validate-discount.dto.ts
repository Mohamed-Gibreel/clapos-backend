import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateDiscountDTO {
  @IsString()
  @IsNotEmpty()
  code: string;
}
