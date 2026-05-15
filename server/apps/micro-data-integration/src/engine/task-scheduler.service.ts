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
      await this.runTaskManually(task.id);
    });

    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();
    this.logger.log(`定时任务 ${task.name} 已加载，Cron: ${task.cronExpression}`);
  }

  /**
   * 手动或定时执行任务，并记录执行日志
   */
  async runTaskManually(taskId: number) {
    const task = await this.taskRep.findOne({ where: { id: taskId } });
    if (!task) return;
    const source = await this.sourceRep.findOne({ where: { id: task.sourceId } });
    if (!source) return;

    this.logger.debug(`开始执行任务: ${task.name}`);
    task.lastRunTime = new Date();
    
    try {
      if (source.type === 'MYSQL' || source.type === 'POSTGRESQL') {
        await this.executeDbTask(task, source);
      } else if (source.type === 'FILE') {
        await this.executeFileTask(task, source);
      }
      task.lastRunStatus = '0';
      task.lastRunMsg = '执行成功';
    } catch (err) {
      this.logger.error(`任务 ${task.name} 执行失败`, err);
      task.lastRunStatus = '1';
      task.lastRunMsg = err.message ? err.message.substring(0, 500) : '未知错误';
    }

    // 保存执行状态，这里包裹在 try-catch 中防止表字段还没加导致的报错崩溃
    try {
      await this.taskRep.save(task);
    } catch (e) {}
  }

  private async executeDbTask(task: DataIntegrationTaskEntity, source: DataIntegrationSourceEntity) {
    if (!task.querySqlOrTopic) return;

    let connection;
    let pgClient;

    // 连接初始化
    if (source.type === 'MYSQL') {
      const connStr = source.connectionStr || '';
      const match = connStr.match(/mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);

      if (match) {
        connection = await mysql.createConnection({
          host: match[3],
          port: Number(match[4]),
          user: match[1] || source.username,
          password: match[2] || source.password,
          database: match[5],
        });
      } else {
        connection = await mysql.createConnection({
          host: source.connectionStr,
          user: source.username,
          password: source.password,
          database: 'dma' // fallback
        });
      }
    } else if (source.type === 'POSTGRESQL') {
      const { Client } = require('pg');
      let str = source.connectionStr.replace('jdbc:postgresql://', '');
      str = str.split('?')[0];
      const parts = str.split('/');
      const hostPort = parts[0].split(':');
      const host = hostPort[0];
      const port = parseInt(hostPort[1] || '5432', 10);
      const database = parts[1];
      
      pgClient = new Client({
        host, port, user: source.username, password: source.password, database
      });
      await pgClient.connect();
    }

    try {
      const batchSize = task.batchSize || 0;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        let finalSql = task.querySqlOrTopic;
        if (batchSize > 0) {
          // 为了安全分页，建议用户SQL中最好有 ORDER BY
          finalSql = `SELECT * FROM (${task.querySqlOrTopic}) AS tmp LIMIT ${batchSize} OFFSET ${offset}`;
        }

        let rows = [];
        if (source.type === 'MYSQL') {
          [rows] = await connection.execute(finalSql);
        } else if (source.type === 'POSTGRESQL') {
          const result = await pgClient.query(finalSql);
          rows = result.rows;
        }

        if (Array.isArray(rows) && rows.length > 0) {
          await this.receiverService.receiveData(task.id, rows, task.autoBackfill === 1, task.interpolation === 1);
          offset += rows.length;
          
          // 如果开启了分批且拉取到的数据刚好等于批次大小，说明可能还有下一批
          if (batchSize > 0 && rows.length === batchSize) {
            hasMore = true;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } finally {
      if (connection) await connection.end();
      if (pgClient) await pgClient.end();
    }
  }

  private async executeFileTask(task: DataIntegrationTaskEntity, source: DataIntegrationSourceEntity) {
    // 安全：限制文件路径仅允许在 source.connectionStr 指定的目录下
    const baseDir = (source.connectionStr || '').trim();
    const rawPath = (task.querySqlOrTopic || '').trim();

    let filePath: string;
    if (baseDir) {
      const resolvedBase = require('path').resolve(baseDir);
      const resolvedFile = require('path').resolve(rawPath);
      // 防止路径穿越攻击：确保解析后的文件路径在允许的目录内
      if (!resolvedFile.startsWith(resolvedBase + require('path').sep) && resolvedFile !== resolvedBase) {
        this.logger.error(`文件路径穿越检测: ${rawPath} 不在允许的目录 ${resolvedBase} 内`);
        throw new Error(`文件路径不在允许的目录范围内`);
      }
      filePath = resolvedFile;
    } else {
      // 未配置 baseDir 时拒绝绝对路径，仅允许相对路径
      if (require('path').isAbsolute(rawPath)) {
        this.logger.error(`未配置 baseDir 时不允许使用绝对路径: ${rawPath}`);
        throw new Error(`未配置 baseDir，不允许绝对路径`);
      }
      filePath = require('path').resolve(rawPath);
    }

    if (!fs.existsSync(filePath)) return;

    const stats = fs.statSync(filePath);
    if (stats.isFile() && filePath.endsWith('.csv')) {
      // 将 CSV 流解析包装为 Promise，确保等待完成后再返回
      return new Promise<void>((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            try {
              await this.receiverService.receiveData(
                task.id, results, task.autoBackfill === 1, task.interpolation === 1
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    }
  }
}