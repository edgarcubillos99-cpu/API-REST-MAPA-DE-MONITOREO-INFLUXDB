import { Test, TestingModule } from '@nestjs/testing';
import { ClasificationsService } from './clasifications.service';

describe('ClasificationsService', () => {
  let service: ClasificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClasificationsService],
    }).compile();

    service = module.get<ClasificationsService>(ClasificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
