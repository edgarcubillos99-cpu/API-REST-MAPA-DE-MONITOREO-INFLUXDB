import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PositionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  x: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  y: string;
}
