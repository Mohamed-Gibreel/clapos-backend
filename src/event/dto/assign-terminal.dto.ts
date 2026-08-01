import { IsUUID } from 'class-validator';

export class AssignTerminalDTO {
  @IsUUID()
  terminalId: string;
}
