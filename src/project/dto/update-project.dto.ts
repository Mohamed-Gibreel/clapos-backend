import { PartialType } from '@nestjs/swagger';
import { CreateProjectDTO } from './create-project.dto';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateProjectDTO extends PartialType(CreateProjectDTO) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
