import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateClasificationDto {
  @ApiProperty({
    description: 'Nombre de la clasificación',
    example: 'Crítico',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la clasificación',
    example: 'Mapas con prioridad crítica',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Color en formato hexadecimal',
    example: '#EF4444',
    default: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'El color debe estar en formato hexadecimal (ej: #FF5733)',
  })
  color?: string;
}
