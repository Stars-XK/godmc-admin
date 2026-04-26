import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_data_task', {
  comment: '【数据接入】数据接入任务配置表',
})
export class DataIntegrationTaskEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '任务ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '任务ID' })
  public id: number;

  @ApiProperty({ type: String, description: '任务名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '任务名称' })
  public name: string;

  @ApiProperty({ type: Number, description: '绑定的数据源ID' })
  @Column({ type: 'bigint', name: 'source_id', comment: '绑定的数据源ID' })
  public sourceId: number;

  @ApiProperty({ type: String, description: '执行频率 (Cron表达式)' })
  @Column({ type: 'varchar', name: 'cron_expression', length: 100, comment: '执行频率 (Cron表达式)', nullable: true })
  public cronExpression: string;

  @ApiProperty({ type: Number, description: '单次拉取批次大小(0为不限制)' })
  @Column({ type: 'int', name: 'batch_size', default: 0, comment: '单次拉取批次大小(0为不限制)' })
  public batchSize: number;

  @ApiProperty({ type: String, description: '提取指令 (SQL/Topic/FilePath)' })
  @Column({ type: 'text', name: 'query_sql_or_topic', comment: '提取指令 (SQL/Topic/FilePath)', nullable: true })
  public querySqlOrTopic: string;

  @ApiProperty({ description: '是否自动触发历史补录 (0-否 1-是)' })
  @Column({ name: 'auto_backfill', type: 'tinyint', default: 0, comment: '是否自动触发历史补录 (0-否 1-是)' })
  public autoBackfill: number;

  @ApiProperty({ description: '是否自动插值补全空洞 (0-否 1-是)' })
  @Column({ name: 'interpolation', type: 'tinyint', default: 0, comment: '是否自动插值补全空洞 (0-否 1-是)' })
  public interpolation: number;

  @ApiProperty({ type: String, description: '目标实体表名或类别' })
  @Column({ type: 'varchar', name: 'target_entity', length: 100, comment: '目标实体表名或类别(如 sys_zone, sys_device, tdengine)', nullable: true })
  public targetEntity: string;

  @ApiProperty({ type: String, description: '任务状态 (0正常 1停用)' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '任务状态 (0正常 1停用)' })
  public status: string;

  @ApiProperty({ type: Date, description: '最后执行时间' })
  @Column({ type: 'datetime', name: 'last_run_time', nullable: true, comment: '最后执行时间' })
  public lastRunTime: Date;

  @ApiProperty({ type: String, description: '最后执行状态 (0-成功 1-失败)' })
  @Column({ type: 'char', name: 'last_run_status', length: 1, nullable: true, comment: '最后执行状态 (0-成功 1-失败)' })
  public lastRunStatus: string;

  @ApiProperty({ type: String, description: '最后执行日志信息' })
  @Column({ type: 'text', name: 'last_run_msg', nullable: true, comment: '最后执行日志信息' })
  public lastRunMsg: string;
}