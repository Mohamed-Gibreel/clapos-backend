import { IsEnum } from 'class-validator';
import { Roles } from 'src/utils/decorators/roles.decorator';

export class CreateRoleDTO {
  @IsEnum(Roles)
  name: Roles;
}
