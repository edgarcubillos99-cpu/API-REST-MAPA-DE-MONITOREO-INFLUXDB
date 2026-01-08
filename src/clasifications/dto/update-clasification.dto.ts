import { PartialType } from '@nestjs/swagger';
import { CreateClasificationDto } from './create-clasification.dto';

export class UpdateClasificationDto extends PartialType(CreateClasificationDto) {}
