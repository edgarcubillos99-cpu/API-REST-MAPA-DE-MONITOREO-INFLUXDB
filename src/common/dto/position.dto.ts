import { IsNotEmpty, IsString } from 'class-validator';

export class PositionDto {
  @IsString()
  @IsNotEmpty()
  x: string;

  @IsString()
  @IsNotEmpty()
  y: string;
}
