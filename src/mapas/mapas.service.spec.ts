import { Test, TestingModule } from '@nestjs/testing';
import { MapasService } from './mapas.service';

describe('MapasService', () => {
  let service: MapasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MapasService],
    }).compile();

    service = module.get<MapasService>(MapasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
