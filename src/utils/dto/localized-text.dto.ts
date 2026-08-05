import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LocalizedText } from '../types/localized-text';

export class LocalizedTextDTO implements LocalizedText {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  ar?: string;
}
