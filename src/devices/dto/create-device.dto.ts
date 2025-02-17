import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PositionDto } from 'src/common/dto/position.dto';
import { MAKE } from 'src/common/enums/make.enum';
import { STATUS } from 'src/common/enums/status.enum';

export class CreateDeviceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ip: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([
    MAKE.MIKROTIK,
    MAKE.HPE,
    MAKE.UBIQUITI,
    MAKE.CAMBIUM,
    MAKE.JUNIPER,
    MAKE.TPLINK,
  ])
  make: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'MapUUID debe ser un ObjectId válido de MongoDB',
  })
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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  community: string;
}
