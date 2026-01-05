import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsDate,
  IsBoolean,
  IsPositive,
  IsOptional,
  ArrayMaxSize,
  IsNumberString,
  IsEmail,
} from 'class-validator';

export class CreateTicketsUbersmithDto {
  @IsBoolean()
  Internal_ticket: boolean;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  subject: string;

  @IsArray()
  cc?: string[];

  @IsArray()
  bcc?: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  priority?: number;

  @IsInt()
  @Min(0)
  @Max(4)
  impact?: number;

  @IsInt()
  @IsPositive()
  queue?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  classification_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  ticket_resolution_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  client_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  contact_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  brand_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  service_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  device_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  opportunity_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  order_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quote_id?: number;

  @IsOptional()
  @IsDate()
  timeStamp?: Date;

  @IsOptional()
  @IsBoolean()
  no_notification?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  attachments?: Express.Multer.File[];
}

export class CreateTicketsUbersmithCircuitoDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  subject: string;

  /**
   * Lista de correos electronicos para CC.
   * Puede ser un string con correos separados por coma o un array de strings.
   * Ejemplo: "a@b.com,c@d.com" o ["a@b.com", "c@d.com"]
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];
}

export class CreateTicketsUbersmithMultiCircuitosDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  subject: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsNumberString({}, { each: true })
  cids: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return value;
  })
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];
}
