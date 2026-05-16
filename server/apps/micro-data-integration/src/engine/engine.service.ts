import { Injectable, Logger } from '@nestjs/common';
import { TaskSchedulerService } from './task-scheduler.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(
    private readonly taskSchedulerService: TaskSchedulerService,
    private readonly kafkaConsumerService: KafkaConsumerService,
  ) {}

  async reloadTasks() {
    return this.taskSchedulerService.reloadAllTasks();
  }

  async runTaskManually(taskId: number) {
    return this.taskSchedulerService.runTaskManually(taskId);
  }

  async stopAll() {
    return this.kafkaConsumerService.stopAll();
  }
}
