import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class UpdateTicketsUbersmithBasicDto {
  @ApiPropertyOptional({
    description: 'ID del departamento/cola',
    example: 71,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  queue?: number;

  @ApiPropertyOptional({
    description: 'ID del usuario staff asignado al ticket',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @IsPositive()
  assignment?: number;

  @ApiPropertyOptional({
    description: 'Prioridad del ticket (0=Baja, 1=Normal, 2=Alta, 3=911)',
    example: 1,
    minimum: 0,
    maximum: 3,
  })
  @IsOptional()
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
  @IsInt()
  @Min(0)
  @Max(4)
  impact?: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de resolución (1=Fixed, 2=Invalid, 3=Duplicate, 4=Completed, etc.)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  ticket_resolution_id?: number;
}
