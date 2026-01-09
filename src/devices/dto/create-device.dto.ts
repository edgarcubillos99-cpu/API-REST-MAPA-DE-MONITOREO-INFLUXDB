import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
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

export class SnmpSettingsDto {
  @ApiProperty({ default: 'UDP' })
  @IsString()
  protocol: string;

  @ApiProperty({ default: 161 })
  @IsNumber()
  port: number;

  @ApiProperty({ default: 'osnsnmpro' })
  @IsString()
  community: string;
}

export class CreateDeviceDto {
  @IsNotEmpty()
  @IsString()
  ip: string;

  @IsNotEmpty()
  @IsString()
  description: string;

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

  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ApiProperty({ type: [String], required: true })
  @IsArray()
  @ArrayUnique()
  @IsMongoId({
    each: true,
    message: 'MapUUID debe ser un ObjectId válido de MongoDB',
  })
  MapUUID: string[];

  @IsNotEmpty()
  @IsString()
  @IsIn([STATUS.UP, STATUS.DOWN, STATUS.VERIFIED])
  StatusIcmp: string;

  @IsNotEmpty()
  @IsBoolean()
  Status: boolean;

  @ApiProperty({ required: false, type: PingConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PingConfigDto)
  PingConfig?: PingConfigDto;

  @ApiProperty({ required: false, type: SnmpSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SnmpSettingsDto)
  SnmpSettings?: SnmpSettingsDto;

  @IsNotEmpty()
  @IsString()
  @IsIn(['ROUTER', 'SWITCHL2', 'SWITCHL3', 'FIREWALL', 'ACCESSPOINT', 'UPS', 'SERVER', 'STORAGE', 'OTHER'])
  Type: string;
}
