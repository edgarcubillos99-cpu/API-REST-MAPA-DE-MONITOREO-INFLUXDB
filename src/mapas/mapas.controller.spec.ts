import { Test, TestingModule } from '@nestjs/testing';
import { MapasController } from './mapas.controller';
import { MapasService } from './mapas.service';

describe('MapasController', () => {
  let controller: MapasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapasController],
      providers: [MapasService],
    }).compile();

    controller = module.get<MapasController>(MapasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
