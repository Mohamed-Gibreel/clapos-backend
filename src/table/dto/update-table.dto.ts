import { PartialType } from '@nestjs/mapped-types';
import { CreateTableDTO } from './create-table.dto';

export class UpdateTableDTO extends PartialType(CreateTableDTO) {}
