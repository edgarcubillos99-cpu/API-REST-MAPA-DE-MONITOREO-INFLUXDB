import { Test, TestingModule } from '@nestjs/testing';
import { UbersmithController } from './ubersmith.controller';
import { UbersmithService } from './ubersmith.service';

describe('UbersmithController', () => {
  let controller: UbersmithController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UbersmithController],
      providers: [UbersmithService],
    }).compile();

    controller = module.get<UbersmithController>(UbersmithController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
