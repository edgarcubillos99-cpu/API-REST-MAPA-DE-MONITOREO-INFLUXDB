import { OmitType } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class EventLogsPaginationDto extends OmitType(PaginationDto, [
  'name',
] as const) {
  @IsString()
  @IsOptional()
  logType?: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  alert?: string;
}
