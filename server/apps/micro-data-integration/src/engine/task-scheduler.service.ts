import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity } from '@app/common';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import * as mysql from 'mysql2/promise';
import * as fs from 'fs-extra';
const csv = require('csv-parser');
import { ReceiverService } from '../receiver/receiver.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Injectable()
export class TaskSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(DataIntegrationTaskEntity)
    private readonly taskRep: Repository<DataIntegrationTaskEntity>,
    @InjectRepository(DataIntegrationSourceEntity)
    private readonly sourceRep: Repository<DataIntegrationSourceEntity>,
    private readonly receiverService: ReceiverService,
    private readonly kafkaConsumerService: KafkaConsumerService,
  ) {}

  async onModuleInit() {
    await this.reloadAllTasks();
  }

  /**
   * 重新加载所有启用的任务
   */
  async reloadAllTasks() {
    this.logger.log('开始加载所有启用的接入任务...');
    
    // 清理旧任务
    this.clearAllJobs();
    await this.kafkaConsumerService.stopAll();

    const tasks = await this.taskRep.find({ where: { status: '0' } });
    for (const task of tasks) {
      const source = await this.sourceRep.findOne({ where: { id: task.sourceId } });
      if (!source) continue;

      if (source.type === 'MYSQL' || source.type === 'FILE') {
        if (!task.cronExpression) {
          this.logger.warn(`任务 ${task.name} 缺少 Cron 表达式，跳过加载`);
          continue;
        }
        this.addCronJob(task, source);
      } else if (source.type === 'KAFKA') {
        await this.kafkaConsumerService.startConsumer(task, source);
      }
    }
  }

  private clearAllJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key) => {
      this.schedulerRegistry.deleteCronJob(key);
      value.stop();
    });
  }

  private addCronJob(task: DataIntegrationTaskEntity, source: DataIntegrationSourceEntity) {
    const jobName = `task_${task.id}`;
    const job = new CronJob(task.cronExpression, async () => {
      this.logger.debug(`开始执行定时任务: ${task.name}`);
      try {
        if (source.type === 'MYSQL') {
          await this.executeDbTask(task, source);
        } else if (source.type === 'FILE') {
          await this.executeFileTask(task, source);
        }
      } catch (err) {
        this.logger.error(`任务 ${task.name} 执行失败`, err);
      }
    });

    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();
    this.logger.log(`定时任务 ${task.name} 已加载，Cron: ${task.cronExpression}`);
  }

  private async executeDbTask(task: DataIntegrationTaskEntity, source: DataIntegrationSourceEntity) {
    if (!task.querySqlOrTopic) return;
    
    // 解析 mysql 连接串，比如 mysql://user:pass@host:port/dbname
    // 这里简单处理，真实生产应使用更完善的解析或存储独立字段
    const connStr = source.connectionStr || '';
    const match = connStr.match(/mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);
    
    let connection;
    if (match) {
      connection = await mysql.createConnection({
        host: match[3],
        port: Number(match[4]),
        user: match[1] || source.username,
        password: match[2] || source.password,
        database: match[5],
      });
    } else {
      // 退化为尝试直接用 host 解析
      connection = await mysql.createConnection({
        host: source.connectionStr,
        user: source.username,
        password: source.password,
      });
    }

    const [rows] = await connection.execute(task.querySqlOrTopic);
    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      await this.receiverService.receiveData(task.id, rows, task.autoBackfill === 1, task.interpolation === 1);
    }
  }

  private async executeFileTask(task: DataIntegrationTaskEntity, source: DataIntegrationSourceEntity) {
    const filePath = task.querySqlOrTopic; // 假设存放的是文件或目录路径
    if (!fs.existsSync(filePath)) return;

    const stats = fs.statSync(filePath);
    if (stats.isFile() && filePath.endsWith('.csv')) {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          await this.receiverService.receiveData(task.id, results, task.autoBackfill === 1, task.interpolation === 1);
          // 处理完后可以选择重命名或删除文件，这里暂不处理
        });
    }
  }
}