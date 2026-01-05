import { PartialType } from '@nestjs/swagger';
import { CreateMapaDto } from './create-mapa.dto';

export class UpdateMapaDto extends PartialType(CreateMapaDto) {}
