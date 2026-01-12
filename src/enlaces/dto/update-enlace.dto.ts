import { PartialType } from '@nestjs/swagger';
import { CreateEnlaceDto } from './create-enlace.dto';

export class UpdateEnlaceDto extends PartialType(CreateEnlaceDto) {}
