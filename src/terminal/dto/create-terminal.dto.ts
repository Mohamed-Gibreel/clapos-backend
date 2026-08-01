import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTerminalDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
