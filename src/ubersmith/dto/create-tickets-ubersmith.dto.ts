import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Indica si es un ticket interno',
    example: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  Internal_ticket: boolean;

  @ApiProperty({
    description: 'Cuerpo/contenido del ticket',
    example: 'Descripción detallada del problema...',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @ApiProperty({
    description: 'Asunto del ticket',
    example: 'Problema de conectividad en sitio X',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiPropertyOptional({
    description: 'Lista de correos para copia (CC)',
    example: ['usuario@ejemplo.com'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    return value;
  })
  @IsArray()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'Lista de correos para copia oculta (BCC)',
    example: ['admin@ejemplo.com'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    return value;
  })
  @IsArray()
  bcc?: string[];

  @ApiPropertyOptional({
    description: 'Prioridad del ticket (0=Baja, 1=Normal, 2=Alta, 3=911)',
    example: 1,
    minimum: 0,
    maximum: 3,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  @Max(3)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Impacto del ticket (0=Sin impacto, 1=Menor, 2=Moderado, 3=Significativo, 4=Extensivo)',
    example: 2,
    minimum: 0,
    maximum: 4,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  @Max(4)
  impact?: number;

  @ApiPropertyOptional({
    description: 'ID del departamento/cola',
    example: 71,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  queue?: number;

  @ApiPropertyOptional({
    description: 'ID de clasificación del ticket',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  classification_id?: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de resolución',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  ticket_resolution_id?: number;

  @ApiPropertyOptional({
    description: 'ID del cliente',
    example: 12345,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  client_id?: number;

  @ApiPropertyOptional({
    description: 'ID del contacto',
    example: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  contact_id?: number;

  @ApiPropertyOptional({
    description: 'ID de la marca',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  brand_id?: number;

  @ApiPropertyOptional({
    description: 'ID del servicio',
    example: 500,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  service_id?: number;

  @ApiPropertyOptional({
    description: 'ID del dispositivo',
    example: 200,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  device_id?: number;

  @ApiPropertyOptional({
    description: 'ID de la oportunidad',
    example: 50,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  opportunity_id?: number;

  @ApiPropertyOptional({
    description: 'ID de la orden',
    example: 300,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  order_id?: number;

  @ApiPropertyOptional({
    description: 'ID de la cotización',
    example: 150,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsPositive()
  quote_id?: number;

  @ApiPropertyOptional({
    description: 'Fecha y hora del ticket',
    example: '2025-01-09T12:00:00Z',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  timeStamp?: Date;

  @ApiPropertyOptional({
    description: 'Deshabilitar notificaciones',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  no_notification?: boolean;
}

export class CreateTicketsUbersmithCircuitoDto {
  @ApiProperty({
    description: 'Cuerpo/contenido del ticket',
    example: 'Descripción del problema con el circuito...',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @ApiProperty({
    description: 'Asunto del ticket',
    example: 'Avería en circuito CID-12345',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiPropertyOptional({
    description: 'Lista de correos para CC (string separado por comas o array)',
    example: ['soporte@ejemplo.com', 'admin@ejemplo.com'],
    type: [String],
  })
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
  @ApiProperty({
    description: 'Cuerpo/contenido del ticket',
    example: 'Descripción del problema con múltiples circuitos...',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @ApiProperty({
    description: 'Asunto del ticket',
    example: 'Avería múltiple en circuitos',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiProperty({
    description: 'Lista de CIDs (Circuit IDs) afectados',
    example: ['12345', '12346', '12347'],
    type: [String],
  })
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

  @ApiPropertyOptional({
    description: 'Lista de correos para CC (string separado por comas o array)',
    example: ['soporte@ejemplo.com'],
    type: [String],
  })
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
