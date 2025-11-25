import { OmitType } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class EventLogsPaginationDto extends OmitType(PaginationDto, [
  'name',
] as const) {}
