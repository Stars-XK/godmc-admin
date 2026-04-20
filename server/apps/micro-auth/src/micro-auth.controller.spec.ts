import { Test, TestingModule } from '@nestjs/testing';
import { MicroAuthController } from './micro-auth.controller';
import { MicroAuthService } from './micro-auth.service';

describe('MicroAuthController', () => {
  let microAuthController: MicroAuthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MicroAuthController],
      providers: [MicroAuthService],
    }).compile();

    microAuthController = app.get<MicroAuthController>(MicroAuthController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(microAuthController.getHello()).toBe('Hello World!');
    });
  });
});
