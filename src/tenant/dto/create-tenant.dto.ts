import { IsString } from 'class-validator';

export class CreateTenantDTO {
  @IsString()
  name: string;
}
