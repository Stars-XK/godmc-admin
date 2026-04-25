import { Test, TestingModule } from '@nestjs/testing';
import { MicroAlarmController } from './micro-alarm.controller';
import { MicroAlarmService } from './micro-alarm.service';

describe('MicroAlarmController', () => {
  let microAlarmController: MicroAlarmController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MicroAlarmController],
      providers: [MicroAlarmService],
    }).compile();

    microAlarmController = app.get<MicroAlarmController>(MicroAlarmController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(microAlarmController.getHello()).toBe('Hello World!');
    });
  });
});
