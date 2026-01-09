import { PartialType } from '@nestjs/swagger';
import { CreateUbersmithDto } from './create-ubersmith.dto';

export class UpdateUbersmithDto extends PartialType(CreateUbersmithDto) {}
