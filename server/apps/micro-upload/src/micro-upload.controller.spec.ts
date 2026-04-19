import { Test, TestingModule } from '@nestjs/testing';
import { MicroUploadController } from './micro-upload.controller';
import { MicroUploadService } from './micro-upload.service';

describe('MicroUploadController', () => {
  let microUploadController: MicroUploadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MicroUploadController],
      providers: [MicroUploadService],
    }).compile();

    microUploadController = app.get<MicroUploadController>(MicroUploadController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(microUploadController.getHello()).toBe('Hello World!');
    });
  });
});
