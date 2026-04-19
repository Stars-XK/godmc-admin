import { Test, TestingModule } from '@nestjs/testing';
import { MicroToolsController } from './micro-tools.controller';
import { MicroToolsService } from './micro-tools.service';

describe('MicroToolsController', () => {
  let microToolsController: MicroToolsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MicroToolsController],
      providers: [MicroToolsService],
    }).compile();

    microToolsController = app.get<MicroToolsController>(MicroToolsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(microToolsController.getHello()).toBe('Hello World!');
    });
  });
});
