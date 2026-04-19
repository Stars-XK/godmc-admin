import { Test, TestingModule } from '@nestjs/testing';
import { MicroMonitorController } from './micro-monitor.controller';
import { MicroMonitorService } from './micro-monitor.service';

describe('MicroMonitorController', () => {
  let microMonitorController: MicroMonitorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MicroMonitorController],
      providers: [MicroMonitorService],
    }).compile();

    microMonitorController = app.get<MicroMonitorController>(MicroMonitorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(microMonitorController.getHello()).toBe('Hello World!');
    });
  });
});
