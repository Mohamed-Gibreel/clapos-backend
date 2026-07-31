import { IsString, IsUUID } from 'class-validator';

export class CreateProjectDTO {
  @IsString()
  name: string;

  @IsUUID()
  tenantId: string;
}
