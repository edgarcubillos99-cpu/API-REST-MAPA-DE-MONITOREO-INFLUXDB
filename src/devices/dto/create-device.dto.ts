import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PositionDto } from 'src/common/dto/position.dto';
import { MAKE } from 'src/common/enums/make.enum';
import { STATUS } from 'src/common/enums/status.enum';

export class PingConfigDto {
  @ApiProperty({ default: 8 })
  @IsNumber()
  count: number;

  @ApiProperty({ default: 100 })
  @IsNumber()
  intervall: number;

  @ApiProperty({ default: 1200 })
  @IsNumber()
  sumTimeOut: number;

  @ApiProperty({ default: 70 })
  @IsNumber()
  percentLostPackage: number;

  @ApiProperty({ default: 64 })
  @IsNumber()
  sizePackage: number;
}

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
    MAKE.ICT,
    MAKE.TPDIN,
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
  @IsNumber()
  portsnmp: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  Status: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  community: string;

  @ApiProperty({ required: false, type: PingConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PingConfigDto)
  PingConfig?: PingConfigDto;
}
