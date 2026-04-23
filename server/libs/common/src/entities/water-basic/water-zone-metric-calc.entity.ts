import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FullBaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_zone_metric_calc', {
  comment: '【水务基础】分区指标计算规则表',
})
export class WaterZoneMetricCalcEntity extends FullBaseEntity {
  @ApiProperty({ type: Number, description: '规则ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '规则ID' })
  public id: number;

  @ApiProperty({ type: String, description: '分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '分区编码' })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '指标类型(如 supply:供水量, min_flow:夜间最小流量)' })
  @Column({ type: 'varchar', name: 'metric_type', length: 50, comment: '指标类型' })
  public metricType: string;

  @ApiProperty({ type: String, description: '测点编码' })
  @Column({ type: 'varchar', name: 'point_code', length: 50, comment: '测点编码' })
  public pointCode: string;

  @ApiProperty({ type: Number, description: '计算符号(1加法 -1减法)' })
  @Column({ type: 'int', name: 'calc_sign', comment: '计算符号(1加法 -1减法)' })
  public calcSign: number;
}