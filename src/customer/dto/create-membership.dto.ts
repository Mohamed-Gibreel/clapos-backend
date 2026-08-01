import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { MembershipType } from '../entities/membership.entity';

export class CreateMembershipDTO {
  @IsEnum(MembershipType)
  type: MembershipType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
