import { IsNotEmpty, IsString } from 'class-validator';

export class TerminalLoginDTO {
  @IsString()
  @IsNotEmpty()
  deviceToken: string;
}
