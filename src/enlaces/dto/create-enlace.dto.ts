import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator';
import { MEDIO_TRANSMICION } from 'src/common/enums/medio-transmicion.enum';

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
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'DeviceDestino debe ser un ObjectId válido de MongoDB',
  })
  DeviceDestino: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  InterfaceOrigen: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  InterfaceDestino: string;

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
  @IsNotEmpty()
  @IsString()
  lastStatusEnlance: string;
}
