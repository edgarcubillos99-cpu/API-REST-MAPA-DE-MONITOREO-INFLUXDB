import { PartialType } from '@nestjs/swagger';
import { CreateTicketsUbersmithDto } from './create-tickets-ubersmith.dto';

export class UpdateTicketsUbersmithDto extends PartialType(
  CreateTicketsUbersmithDto,
) {}
