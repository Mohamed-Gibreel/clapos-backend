import { IsOptional, IsUUID } from 'class-validator';

export class MoveMediaDTO {
  // Pass null to move the file back to the root.
  @IsUUID()
  @IsOptional()
  folderId: string | null;
}
