import { OmitType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AlertsPaginationDto extends OmitType(PaginationDto, [
  'name',
] as const) {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  oid?: string;

  @IsOptional()
  @IsString()
  operator?: string;
}
