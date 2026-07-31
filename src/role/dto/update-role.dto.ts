import { PartialType } from '@nestjs/swagger';
import { CreateRoleDTO } from './create-role.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Roles } from 'src/utils/decorators/roles.decorator';

export class UpdateRoleDTO extends PartialType(CreateRoleDTO) {
  @IsOptional()
  @IsEnum(Roles)
  name?: Roles | undefined;
}
