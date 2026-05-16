import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_burst_event', {
  comment: '【水务基础】爆管事件记录表',
})
export class WaterBurstEventEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '事件ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '事件ID' })
  public id: number;

  @ApiProperty({ type: String, description: '所属分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '所属分区编码' })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '可疑爆管管线编码' })
  @Column({ type: 'varchar', name: 'pipe_code', length: 50, comment: '可疑爆管管线编码', nullable: true })
  public pipeCode: string;

  @ApiProperty({ type: String, description: '爆管类型(FLOW_DROP/PRESSURE_DROP/SUPPLY_DIFF)' })
  @Column({ type: 'varchar', name: 'burst_type', length: 30, comment: '爆管类型' })
  public burstType: string;

  @ApiProperty({ type: Number, description: '置信度(0-100)' })
  @Column({ type: 'int', name: 'confidence', default: 0, comment: '置信度(0-100)' })
  public confidence: number;

  @ApiProperty({ type: Number, description: '严重等级(1-4)' })
  @Column({ type: 'tinyint', name: 'severity', default: 1, comment: '严重等级(1-4)' })
  public severity: number;

  @ApiProperty({ type: String, description: '状态(0=待确认 1=已确认 2=误报 3=已修复)' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态(0待确认 1已确认 2误报 3已修复)' })
  public status: string;

  @ApiProperty({ type: Number, description: '异常前流量值' })
  @Column({ type: 'decimal', name: 'flow_before', precision: 12, scale: 3, comment: '异常前流量值', nullable: true })
  public flowBefore: number;

  @ApiProperty({ type: Number, description: '异常后流量值' })
  @Column({ type: 'decimal', name: 'flow_after', precision: 12, scale: 3, comment: '异常后流量值', nullable: true })
  public flowAfter: number;

  @ApiProperty({ type: Number, description: '异常前压力值' })
  @Column({ type: 'decimal', name: 'pressure_before', precision: 10, scale: 3, comment: '异常前压力值', nullable: true })
  public pressureBefore: number;

  @ApiProperty({ type: Number, description: '异常后压力值' })
  @Column({ type: 'decimal', name: 'pressure_after', precision: 10, scale: 3, comment: '异常后压力值', nullable: true })
  public pressureAfter: number;

  @ApiProperty({ type: Date, description: '异常发生时间' })
  @Column({ type: 'datetime', name: 'anomaly_time', comment: '异常发生时间', nullable: true })
  public anomalyTime: Date;

  @ApiProperty({ type: String, description: '分析描述' })
  @Column({ type: 'text', name: 'description', comment: '分析描述', nullable: true })
  public description: string;

  @ApiProperty({ type: String, description: '影响面GeoJSON' })
  @Column({ type: 'longtext', name: 'affected_area_geojson', comment: '影响面GeoJSON', nullable: true })
  public affectedAreaGeojson: string;

  @ApiProperty({ type: String, description: '受影响管线JSON数组' })
  @Column({ type: 'text', name: 'affected_pipes', comment: '受影响管线JSON', nullable: true })
  public affectedPipes: string;

  @ApiProperty({ type: Number, description: '受影响用户数估计' })
  @Column({ type: 'int', name: 'affected_users', default: 0, comment: '受影响用户数估计' })
  public affectedUsers: number;
}
