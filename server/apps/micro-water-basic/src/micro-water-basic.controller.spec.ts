import { Test, TestingModule } from '@nestjs/testing';
import { MicroWaterBasicController } from './micro-water-basic.controller';
import { MicroWaterBasicService } from './micro-water-basic.service';

describe('MicroWaterBasicController', () => {
  let microWaterBasicController: MicroWaterBasicController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MicroWaterBasicController],
      providers: [MicroWaterBasicService],
    }).compile();

    microWaterBasicController = app.get<MicroWaterBasicController>(MicroWaterBasicController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(microWaterBasicController.getHello()).toBe('Hello World!');
    });
  });
});
