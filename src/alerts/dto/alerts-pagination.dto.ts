import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AlertsPaginationDto extends OmitType(PaginationDto, [
  'name',
] as const) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oid?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  operator?: string;
}
