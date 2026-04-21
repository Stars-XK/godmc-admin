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

  @ApiProperty({ type: String, description: '提取指令 (SQL/Topic/FilePath)' })
  @Column({ type: 'text', name: 'query_sql_or_topic', comment: '提取指令 (SQL/Topic/FilePath)', nullable: true })
  public querySqlOrTopic: string;

  @ApiProperty({ type: String, description: '任务状态 (0正常 1停用)' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '任务状态 (0正常 1停用)' })
  public status: string;
}