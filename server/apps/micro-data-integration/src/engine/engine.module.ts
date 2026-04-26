import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity } from '@app/common';
import { TaskSchedulerService } from './task-scheduler.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { EngineController } from './engine.controller';
import { ReceiverModule } from '../receiver/receiver.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataIntegrationSourceEntity, DataIntegrationTaskEntity]),
    ReceiverModule,
  ],
  controllers: [EngineController],
  providers: [TaskSchedulerService, KafkaConsumerService],
  exports: [TaskSchedulerService],
})
export class EngineModule {}