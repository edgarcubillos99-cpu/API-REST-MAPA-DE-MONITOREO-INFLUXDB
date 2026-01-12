import { Test, TestingModule } from '@nestjs/testing';
import { EnlacesController } from './enlaces.controller';
import { EnlacesService } from './enlaces.service';

describe('EnlacesController', () => {
  let controller: EnlacesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnlacesController],
      providers: [EnlacesService],
    }).compile();

    controller = module.get<EnlacesController>(EnlacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
