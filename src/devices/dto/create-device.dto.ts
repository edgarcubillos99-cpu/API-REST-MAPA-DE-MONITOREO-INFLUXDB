import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PositionDto } from 'src/common/dto/position.dto';
import { STATUS } from 'src/common/enums/status.enum';

export class CreateDeviceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ip: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  MapUUID: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([STATUS.UP, STATUS.DOWN])
  StatusIcmp: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  Status: boolean;
}
