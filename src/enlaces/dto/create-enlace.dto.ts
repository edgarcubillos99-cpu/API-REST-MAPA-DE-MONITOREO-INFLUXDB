import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  IsArray,
  IsMongoId,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MEDIO_TRANSMICION } from 'src/common/enums/medio-transmicion.enum';

class DeviceInterfaceDestinationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'DeviceDestino debe ser un ObjectId válido de MongoDB',
  })
  DeviceDestino: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  InterfaceDestino: string;
}

export class CreateEnlaceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'DeviceOrigen debe ser un ObjectId válido de MongoDB',
  })
  DeviceOrigen: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  InterfaceOrigen: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([
    MEDIO_TRANSMICION.FIBER,
    MEDIO_TRANSMICION.WIRELESS,
    MEDIO_TRANSMICION.CABLE,
  ])
  tipoMedio: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  idsnmp: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn([
    'up',
    'down',
    'testing',
    'unknown',
    'unknown (no estándar o propietario)',
    'dormant',
    'notPresent',
    'lowerLayerDown',
    'none',
  ])
  lastStatus: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @ArrayUnique()
  @IsArray()
  @IsMongoId({
    each: true,
    message: 'MapUUID debe ser un ObjectId válido de MongoDB',
  })
  MapUUID?: string[];

  @ApiProperty({ type: [DeviceInterfaceDestinationDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => DeviceInterfaceDestinationDto)
  DevicesInterfacesDestination: DeviceInterfaceDestinationDto[];
}
