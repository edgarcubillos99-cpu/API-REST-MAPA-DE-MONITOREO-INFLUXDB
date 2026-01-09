import { Test, TestingModule } from '@nestjs/testing';
import { ClasificationsController } from './clasifications.controller';
import { ClasificationsService } from './clasifications.service';

describe('ClasificationsController', () => {
  let controller: ClasificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClasificationsController],
      providers: [ClasificationsService],
    }).compile();

    controller = module.get<ClasificationsController>(ClasificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
