import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PositionDto } from 'src/common/dto/position.dto';

export class CreateLabelDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: true, description: 'Contenido del label html' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ type: PositionDto, required: true })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ApiProperty({ required: true })
  @IsMongoId({ message: 'mapa debe ser un ObjectId válido de MongoDB' })
  @IsNotEmpty()
  mapa: string;
}
