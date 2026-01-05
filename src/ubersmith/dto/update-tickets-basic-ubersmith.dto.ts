import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class UpdateTicketsUbersmithBasicDto {
  @IsOptional()
  @IsInt()
  @IsPositive() //Department ID
  queue?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @IsPositive() //Staff user ID of assignee for tickets
  assignment?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  impact?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  ticket_resolution_id?: number;
}
