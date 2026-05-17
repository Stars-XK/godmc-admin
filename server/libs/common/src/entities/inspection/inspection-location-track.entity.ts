import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_location_track', {
  comment: '【巡检管理】GPS轨迹记录表',
})
export class InspectionLocationTrackEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '轨迹ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: Number, description: '关联任务ID' })
  @Column({ type: 'bigint', name: 'task_id', comment: '关联任务ID' })
  public taskId: number;

  @ApiProperty({ type: Number, description: '用户ID' })
  @Column({ type: 'int', name: 'user_id', comment: '用户ID' })
  public userId: number;

  @ApiProperty({ type: String, description: '经度' })
  @Column({ type: 'varchar', name: 'lng', length: 30, comment: '经度' })
  public lng: string;

  @ApiProperty({ type: String, description: '纬度' })
  @Column({ type: 'varchar', name: 'lat', length: 30, comment: '纬度' })
  public lat: string;

  @ApiProperty({ type: Number, description: '海拔高度(米)' })
  @Column({ type: 'decimal', name: 'altitude', precision: 8, scale: 2, nullable: true, comment: '海拔高度(米)' })
  public altitude: number;

  @ApiProperty({ type: Number, description: '速度(km/h)' })
  @Column({ type: 'decimal', name: 'speed', precision: 6, scale: 2, default: 0.00, comment: '速度(km/h)' })
  public speed: number;

  @ApiProperty({ type: Number, description: '方向角(度)' })
  @Column({ type: 'decimal', name: 'heading', precision: 6, scale: 2, default: 0.00, comment: '方向角(度)' })
  public heading: number;

  @ApiProperty({ type: Number, description: '定位精度(米)' })
  @Column({ type: 'decimal', name: 'accuracy', precision: 6, scale: 2, default: 0.00, comment: '定位精度(米)' })
  public accuracy: number;

  @ApiProperty({ type: Number, description: '电池电量百分比' })
  @Column({ type: 'int', name: 'battery_level', nullable: true, comment: '电池电量百分比' })
  public batteryLevel: number;

  @ApiProperty({ type: String, description: '网络类型（wifi/4g/5g/offline）' })
  @Column({ type: 'varchar', name: 'network_type', length: 10, default: '', comment: '网络类型' })
  public networkType: string;

  @ApiProperty({ type: String, description: '是否偏离电子围栏（0否 1是）' })
  @Column({ type: 'char', name: 'is_geofence_breach', length: 1, default: '0', comment: '是否偏离电子围栏' })
  public isGeofenceBreach: string;

  @ApiProperty({ type: Date, description: '记录时间' })
  @Column({ type: 'datetime', name: 'recorded_at', comment: '记录时间' })
  public recordedAt: Date;

  @ApiProperty({ type: String, description: '同步状态（0已同步 1待同步）' })
  @Column({ type: 'char', name: 'sync_status', length: 1, default: '0', comment: '同步状态' })
  public syncStatus: string;
}
