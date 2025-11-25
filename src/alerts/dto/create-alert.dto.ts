import {
  ArrayUnique,
  IsArray,
  IsBoolean,
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
  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsNotEmpty()
  oid: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['>', '<', '=', '!=', '>=', '<='], {
    message: 'operator debe ser >, <, =, !=, >= o <=',
  })
  operator: string;

  @IsArray()
  @IsNotEmpty()
  @ArrayUnique()
  @IsMongoId({
    each: true,
    message: 'devices has to be a valid MongoDB ObjectId',
  })
  devices: string[];

  @IsNumber()
  @IsNumber()
  @IsOptional()
  @Min(0)
  countAlerts?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  maxNumAlerts?: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+[smhd]$/, {
    message:
      'delay has to be a number followed by s, m, h or d (eg: 1s, 2s, 5d, 7d)',
  })
  delay: string;

  @IsDateString()
  @IsOptional()
  lastAlert?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['low', 'medium', 'high'], {
    message: 'severity has to be low, medium or high',
  })
  severity: string;

  @IsBoolean()
  @IsOptional()
  isActiveAlert?: boolean;

  @IsString()
  @IsOptional()
  iconAlert?: string;

  @IsString()
  @IsOptional()
  colorAlert?: string;
}
