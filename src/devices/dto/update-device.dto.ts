import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateDeviceDto } from './create-device.dto';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
  @ApiPropertyOptional({
    description: 'ID del ticket principal de Ubersmith',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  ubersmithTicketId?: string;
}
