import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateMapaDto } from './create-mapa.dto';

export class UpdateMapaDto extends PartialType(CreateMapaDto) {
  @ApiPropertyOptional({
    description: 'ID del ticket principal de Ubersmith',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  ubersmithTicketId?: string;
}
