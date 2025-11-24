import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PositionDto } from 'src/common/dto/position.dto';
import { STATUS } from 'src/common/enums/status.enum';

export class CreateMapaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  latitude?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  longitude?: string;

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([STATUS.UP, STATUS.DOWN])
  StatusDevices: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({
    each: true,
    message: 'mapsInternal debe ser un ObjectId válido de MongoDB',
  })
  mapsInternal?: string[];
}
