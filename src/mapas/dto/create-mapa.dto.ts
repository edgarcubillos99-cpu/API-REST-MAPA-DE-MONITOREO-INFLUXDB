import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @IsNotEmpty()
  @IsString()
  @IsIn([STATUS.UP, STATUS.DOWN])
  StatusDevices: string;

  @IsOptional()
  @IsBoolean()
  lock?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({
    each: true,
    message: 'mapsInternal debe ser un ObjectId válido de MongoDB',
  })
  mapsInternal?: string[];
}
