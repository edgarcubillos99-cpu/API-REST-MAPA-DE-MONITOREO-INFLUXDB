import { Test, TestingModule } from '@nestjs/testing';
import { UbersmithService } from './ubersmith.service';

describe('UbersmithService', () => {
  let service: UbersmithService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UbersmithService],
    }).compile();

    service = module.get<UbersmithService>(UbersmithService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
