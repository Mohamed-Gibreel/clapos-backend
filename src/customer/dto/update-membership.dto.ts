import { PartialType } from '@nestjs/mapped-types';
import { CreateMembershipDTO } from './create-membership.dto';

export class UpdateMembershipDTO extends PartialType(CreateMembershipDTO) {}
