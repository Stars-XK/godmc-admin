import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity } from '@app/common';
import { ReceiverService } from '../receiver/receiver.service';

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumers: Map<number, Consumer> = new Map();

  constructor(private readonly receiverService: ReceiverService) {}

  async startConsumer(task: DataIntegrationTaskEntity, source: DataIntegrationSourceEntity) {
    try {
      const brokers = source.connectionStr.split(',');
      const kafka = new Kafka({
        clientId: `data-integration-${task.id}`,
        brokers,
      });

      const consumer = kafka.consumer({ groupId: `group-task-${task.id}` });
      await consumer.connect();

      const topic = task.querySqlOrTopic;
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const valueStr = message.value.toString();
            const payload = JSON.parse(valueStr);
            this.logger.debug(`Kafka 收到消息: ${valueStr}`);
            
            // 通过接收器处理
            await this.receiverService.receiveData(task.id, payload);
          } catch (err) {
            this.logger.error(`Kafka 消息处理失败: ${err.message}`, err.stack);
          }
        },
      });

      this.consumers.set(task.id, consumer);
      this.logger.log(`Kafka 消费者已启动: Task ${task.id}, Topic: ${topic}`);
    } catch (err) {
      this.logger.error(`Kafka 消费者启动失败: Task ${task.id}`, err);
    }
  }

  async stopAll() {
    for (const [taskId, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      this.logger.log(`已停止 Kafka 消费者: Task ${taskId}`);
    }
    this.consumers.clear();
  }
}