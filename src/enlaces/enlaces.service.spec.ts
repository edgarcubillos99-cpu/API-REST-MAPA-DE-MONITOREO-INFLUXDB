import { Test, TestingModule } from '@nestjs/testing';
import { EnlacesService } from './enlaces.service';

describe('EnlacesService', () => {
  let service: EnlacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnlacesService],
    }).compile();

    service = module.get<EnlacesService>(EnlacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
