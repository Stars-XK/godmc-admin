import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EngineService } from '../engine/engine.service';

@Injectable()
export class TmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TmqService.name);
  private consumer: any = null;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly engineService: EngineService
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing TDengine TMQ Consumer...');
    this.startConsumer().catch(e => {
      this.logger.warn(`TMQ Consumer failed to start (Native TDengine client might be missing): ${e.message}`);
    });
  }

  async onModuleDestroy() {
    this.isRunning = false;
    if (this.consumer) {
      try {
        // Mock disconnect
        // await this.consumer.unsubscribe();
        // await this.consumer.close();
      } catch (e) {
        this.logger.error('Error closing TMQ consumer', e);
      }
    }
  }

  private async startConsumer() {
    this.isRunning = true;
    // In a real environment, you would use:
    // const { TMQ } = require('@tdengine/client');
    // this.consumer = new TMQ({
    //   url: this.configService.get('tdengine.url'),
    //   user: this.configService.get('tdengine.user'),
    //   pass: this.configService.get('tdengine.pass'),
    //   groupId: 'alarm_group',
    //   clientId: 'micro_alarm_1'
    // });
    // await this.consumer.subscribe(['topic_alarm_ma', 'topic_alarm_slope', 'topic_alarm_diff']);
    
    this.logger.log('TMQ Consumer is ready. Listening to topics: topic_alarm_ma, topic_alarm_slope, topic_alarm_diff');

    // Simulate TMQ polling loop
    while (this.isRunning) {
      try {
        // const msg = await this.consumer.poll(500);
        // if (msg) { this.processMessage(msg); }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep for mock
      } catch (e) {
        this.logger.error('TMQ poll error', e);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Process incoming TMQ message
  public async processMessage(msg: any) {
    try {
      // msg format depends on the topic. For example:
      // { topic: 'topic_alarm_slope', data: [{ ts: '...', device_id: 'dev1', metric_name: 'pressure', val_slope: 0.8 }] }
      const topic = msg.topic;
      for (const row of msg.data) {
        const deviceId = row.device_id?.toString() || 'unknown';
        const metricName = row.metric_name?.toString() || 'unknown';
        
        let factValue = 0;
        let factKey = '';

        if (topic === 'topic_alarm_ma') {
          factValue = row.val_ma;
          factKey = `device.${metricName}.ma_5m`;
        } else if (topic === 'topic_alarm_slope') {
          factValue = row.val_slope;
          factKey = `device.${metricName}.slope_5m`;
        } else if (topic === 'topic_alarm_diff') {
          factValue = row.val_diff;
          factKey = `device.${metricName}.diff_1m`;
        }

        // Construct facts for the rules engine
        const facts = {
          deviceId: deviceId,
          metricName: metricName,
          value: factValue, // Generic value mapping
          [factKey]: factValue // Specific key mapping like device.pressure.slope_5m
        };

        this.logger.debug(`Evaluating TMQ event for ${deviceId}: ${factKey} = ${factValue}`);
        await this.engineService.evaluate(facts);
      }
    } catch (e) {
      this.logger.error('Error processing TMQ message', e);
    }
  }
}
