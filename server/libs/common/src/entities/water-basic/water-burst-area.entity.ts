import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_burst_area', {
  comment: '【水务基础】爆管影响面记录表',
})
export class WaterBurstAreaEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '影响面ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '影响面ID' })
  public id: number;

  @ApiProperty({ type: Number, description: '关联爆管事件ID' })
  @Column({ type: 'bigint', name: 'burst_event_id', comment: '关联爆管事件ID' })
  public burstEventId: number;

  @ApiProperty({ type: String, description: '所属分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '所属分区编码' })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '爆管管线编码' })
  @Column({ type: 'varchar', name: 'pipe_code', length: 50, comment: '爆管管线编码', nullable: true })
  public pipeCode: string;

  @ApiProperty({ type: String, description: '影响面GeoJSON多边形' })
  @Column({ type: 'longtext', name: 'area_geojson', comment: '影响面GeoJSON多边形', nullable: true })
  public areaGeojson: string;

  @ApiProperty({ type: Number, description: '影响面积(m²)' })
  @Column({ type: 'decimal', name: 'area_size', precision: 12, scale: 2, default: 0, comment: '影响面积(m²)' })
  public areaSize: number;

  @ApiProperty({ type: Number, description: '受影响管线数' })
  @Column({ type: 'int', name: 'affected_pipe_count', default: 0, comment: '受影响管线数' })
  public affectedPipeCount: number;

  @ApiProperty({ type: Number, description: '受影响设备数' })
  @Column({ type: 'int', name: 'affected_device_count', default: 0, comment: '受影响设备数' })
  public affectedDeviceCount: number;

  @ApiProperty({ type: Number, description: '预估水损失(m³/h)' })
  @Column({ type: 'decimal', name: 'estimated_water_loss', precision: 10, scale: 2, default: 0, comment: '预估水损失(m³/h)' })
  public estimatedWaterLoss: number;
}
