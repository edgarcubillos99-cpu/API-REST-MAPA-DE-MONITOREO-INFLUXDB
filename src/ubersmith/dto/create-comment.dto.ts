import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumber,
  IsIn,
  IsArray,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateCommentUbersmithDto {
  @ApiProperty({
    description: 'ID del ticket al que se agrega el comentario',
    example: 12345,
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsNotEmpty()
  @IsNumber()
  ticket_id: number;

  @ApiProperty({
    description: 'Contenido del comentario',
    example: 'Este es un comentario sobre el ticket...',
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @ApiProperty({
    description: 'Tipo de comentario (0=Email visible, 1=Comentario interno)',
    example: 1,
    enum: [0, 1],
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1])
  comment: number;

  @ApiPropertyOptional({
    description: 'Lista de correos para CC (string separado por comas o array)',
    example: ['usuario@ejemplo.com'],
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
