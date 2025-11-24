import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['>', '<', '=', '!=', '>=', '<='], {
    message: 'operator debe ser >, <, =, !=, >= o <=',
  })
  operator: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  @ArrayUnique()
  @IsMongoId({
    each: true,
    message: 'devices has to be a valid MongoDB ObjectId',
  })
  devices: string[];

  @ApiProperty()
  @IsNumber()
  @IsNumber()
  @IsOptional()
  @Min(0)
  countAlerts?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  maxNumAlerts?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+[smhd]$/, {
    message:
      'delay has to be a number followed by s, m, h or d (eg: 1s, 2s, 5d, 7d)',
  })
  delay: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  lastAlert?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['low', 'medium', 'high'], {
    message: 'severity has to be low, medium or high',
  })
  severity: string;
}
