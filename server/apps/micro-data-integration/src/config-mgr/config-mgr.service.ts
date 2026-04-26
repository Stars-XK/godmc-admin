import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
import { TaskSchedulerService } from '../engine/task-scheduler.service';

@Injectable()
export class ConfigMgrService {
  private readonly logger = new Logger(ConfigMgrService.name);

  constructor(
    @InjectRepository(DataIntegrationSourceEntity)
    private sourceRep: Repository<DataIntegrationSourceEntity>,
    @InjectRepository(DataIntegrationTaskEntity)
    private taskRep: Repository<DataIntegrationTaskEntity>,
    @InjectRepository(DataIntegrationMappingEntity)
    private mappingRep: Repository<DataIntegrationMappingEntity>,
    private readonly taskSchedulerService: TaskSchedulerService,
  ) {}

  // --- DataSource ---
  async sourceList() {
    const list = await this.sourceRep.find({ order: { id: 'DESC' } });
    return ResultData.ok(list);
  }

  async sourceAdd(data: Partial<DataIntegrationSourceEntity>) {
    await this.sourceRep.save(data);
    return ResultData.ok();
  }

  async sourceUpdate(data: Partial<DataIntegrationSourceEntity>) {
    await this.sourceRep.update(data.id, data);
    return ResultData.ok();
  }

  async sourceDelete(id: number) {
    await this.sourceRep.delete(id);
    return ResultData.ok();
  }

  async testConnection(data: Partial<DataIntegrationSourceEntity>) {
    try {
      if (data.type === 'MYSQL') {
        const mysql = require('mysql2/promise');
        let str = data.connectionStr.replace('jdbc:mysql://', '');
        str = str.split('?')[0];
        const parts = str.split('/');
        const hostPort = parts[0].split(':');
        const host = hostPort[0];
        const port = parseInt(hostPort[1] || '3306', 10);
        const database = parts[1];
        
        const connection = await mysql.createConnection({
          host, port, user: data.username, password: data.password, database, connectTimeout: 3000
        });
        await connection.end();
        return ResultData.ok(null, 'MySQL 连接成功');
      } else if (data.type === 'POSTGRESQL') {
        const { Client } = require('pg');
        let str = data.connectionStr.replace('jdbc:postgresql://', '');
        str = str.split('?')[0];
        const parts = str.split('/');
        const hostPort = parts[0].split(':');
        const host = hostPort[0];
        const port = parseInt(hostPort[1] || '5432', 10);
        const database = parts[1];
        
        const client = new Client({
          host, port, user: data.username, password: data.password, database, connectionTimeoutMillis: 3000
        });
        await client.connect();
        await client.end();
        return ResultData.ok(null, 'PostgreSQL 连接成功');
      } else if (data.type === 'KAFKA') {
        const { Kafka } = require('kafkajs');
        const brokers = data.connectionStr.split(',').map(b => b.trim());
        const kafka = new Kafka({
          clientId: 'test-client',
          brokers,
          connectionTimeout: 3000
        });
        const admin = kafka.admin();
        await admin.connect();
        await admin.disconnect();
        return ResultData.ok(null, 'Kafka 连接成功');
      } else if (data.type === 'FILE') {
        const fs = require('fs');
        if (fs.existsSync(data.connectionStr)) {
          return ResultData.ok(null, '目录存在，且有访问权限');
        } else {
          return ResultData.fail(500, '目录不存在或无权限');
        }
      }
      return ResultData.ok(null, '支持的类型或无需测试');
    } catch (e) {
      return ResultData.fail(500, '连接失败: ' + e.message);
    }
  }

  // --- DataTask ---
  async taskList(sourceId?: number) {
    const where = sourceId ? { sourceId } : {};
    const list = await this.taskRep.find({ where, order: { id: 'DESC' } });
    // 连带查询数据源名称
    const result = await Promise.all(list.map(async task => {
      const source = await this.sourceRep.findOne({ where: { id: task.sourceId }});
      return { ...task, sourceName: source?.name };
    }));
    return ResultData.ok(result);
  }

  async taskAdd(data: Partial<DataIntegrationTaskEntity>) {
    const res = await this.taskRep.save(data);
    this.taskSchedulerService.reloadAllTasks(); // 新增任务后重新加载调度器
    return ResultData.ok(res);
  }

  async taskUpdate(data: Partial<DataIntegrationTaskEntity>) {
    await this.taskRep.update(data.id, data);
    this.taskSchedulerService.reloadAllTasks(); // 更新任务后重新加载调度器
    return ResultData.ok();
  }

  async taskDelete(id: number) {
    await this.taskRep.delete(id);
    // 级联删除映射
    await this.mappingRep.delete({ taskId: id });
    this.taskSchedulerService.reloadAllTasks(); // 删除任务后重新加载调度器
    return ResultData.ok();
  }

  // --- DataMapping ---
  async mappingList(taskId: number) {
    const list = await this.mappingRep.find({ where: { taskId }, order: { id: 'ASC' } });
    return ResultData.ok(list);
  }

  async mappingSaveBatch(taskId: number, mappings: Partial<DataIntegrationMappingEntity>[]) {
    await this.mappingRep.delete({ taskId });
    if (mappings && mappings.length > 0) {
      const entities = mappings.map(m => {
        const entity = new DataIntegrationMappingEntity();
        entity.taskId = taskId;
        entity.sourceField = m.sourceField;
        entity.targetField = m.targetField;
        return entity;
      });
      await this.mappingRep.save(entities);
    }
    return ResultData.ok();
  }

  // --- Local DB Metadata ---
  async getLocalTables() {
    const sql = `
      SELECT table_name AS tableName, table_comment AS tableComment 
      FROM information_schema.tables 
      WHERE table_schema = (SELECT database())
    `;
    const tables = await this.sourceRep.query(sql);
    return ResultData.ok(tables);
  }

  async getLocalColumns(tableName: string) {
    const sql = `
      SELECT column_name AS columnName, column_comment AS columnComment, data_type AS columnType, column_key AS columnKey, extra AS extra
      FROM information_schema.columns
      WHERE table_schema = (SELECT database()) AND table_name = ?
    `;
    const columns = await this.sourceRep.query(sql, [tableName]);
    return ResultData.ok(columns);
  }
}