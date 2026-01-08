import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsMongoId } from 'class-validator';

export class MapaClassificationsDto {
  @ApiProperty({
    description: 'Array de IDs de clasificaciones',
    example: ['64a1b2c3d4e5f6789', '64a1b2c3d4e5f6790'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos una clasificación' })
  @ArrayUnique()
  @IsMongoId({
    each: true,
    message: 'Cada clasificación debe ser un ObjectId válido de MongoDB',
  })
  classificationIds: string[];
}

