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
  @IsNotEmpty()
  @IsNumber()
  ticket_id: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  body: string;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1])
  comment: number;

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
