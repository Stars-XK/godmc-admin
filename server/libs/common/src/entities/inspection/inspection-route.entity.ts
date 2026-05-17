import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_route', {
  comment: '【巡检管理】巡检路线表',
})
export class InspectionRouteEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '路线ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: String, description: '路线名称' })
  @Column({ type: 'varchar', name: 'route_name', length: 100, comment: '路线名称' })
  public routeName: string;

  @ApiProperty({ type: String, description: '路线编码' })
  @Column({ type: 'varchar', name: 'route_code', length: 50, default: '', comment: '路线编码' })
  public routeCode: string;

  @ApiProperty({ type: String, description: '路线几何信息(GeoJSON LineString)' })
  @Column({ type: 'longtext', name: 'route_geom', nullable: true, comment: '路线几何信息(GeoJSON)' })
  public routeGeom: string;

  @ApiProperty({ type: Object, description: '检查点排序(JSON数组，存储检查点ID顺序)' })
  @Column({ type: 'json', name: 'checkpoint_order', nullable: true, comment: '检查点排序' })
  public checkpointOrder: number[];

  @ApiProperty({ type: Number, description: '预计耗时(分钟)' })
  @Column({ type: 'int', name: 'estimated_duration', default: 0, comment: '预计耗时(分钟)' })
  public estimatedDuration: number;

  @ApiProperty({ type: Number, description: '总距离(米)' })
  @Column({ type: 'decimal', name: 'total_distance', precision: 10, scale: 2, default: 0.00, comment: '总距离(米)' })
  public totalDistance: number;

  @ApiProperty({ type: Number, description: '电子围栏缓冲半径(米)' })
  @Column({ type: 'int', name: 'geofence_radius', default: 50, comment: '电子围栏缓冲半径(米)' })
  public geofenceRadius: number;

  @ApiProperty({ type: String, description: '路线描述' })
  @Column({ type: 'varchar', name: 'description', length: 500, default: '', comment: '路线描述' })
  public description: string;

  @ApiProperty({ type: Number, description: '检查点数量' })
  @Column({ type: 'int', name: 'checkpoint_count', default: 0, comment: '检查点数量' })
  public checkpointCount: number;

  @ApiProperty({ type: Number, description: '所属部门ID' })
  @Column({ type: 'int', name: 'dept_id', nullable: true, comment: '所属部门ID' })
  public deptId: number;

  @ApiProperty({ type: Number, description: '显示顺序' })
  @Column({ type: 'int', name: 'sort', default: 0, comment: '排序号' })
  public sort: number;
}
