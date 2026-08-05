import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFolderDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  // Pass null to move the folder to the root level.
  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
