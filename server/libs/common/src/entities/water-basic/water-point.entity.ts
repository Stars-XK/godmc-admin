import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_point', {
  comment: '水务基础-测点信息表',
})
export class WaterPointEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '测点ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '测点ID' })
  public id: number;

  @ApiProperty({ type: String, description: '测点名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '测点名称' })
  public name: string;

  @ApiProperty({ type: String, description: '测点编码' })
  @Column({ type: 'varchar', name: 'code', length: 50, comment: '测点编码(设备通信唯一标识)' })
  public code: string;

  @ApiProperty({ type: String, description: '所属设备编码' })
  @Column({ type: 'varchar', name: 'device_code', length: 50, comment: '所属设备编码' })
  public deviceCode: string;

  @ApiProperty({ type: String, description: '测点类型(流量/压力/液位/水质等)' })
  @Column({ type: 'varchar', name: 'type', length: 20, comment: '测点类型', default: '1' })
  public type: string;

  @ApiProperty({ type: String, description: '量程上限' })
  @Column({ type: 'decimal', name: 'range_max', precision: 10, scale: 2, comment: '量程上限', nullable: true })
  public rangeMax: number;

  @ApiProperty({ type: String, description: '量程下限' })
  @Column({ type: 'decimal', name: 'range_min', precision: 10, scale: 2, comment: '量程下限', nullable: true })
  public rangeMin: number;

  @ApiProperty({ type: String, description: '报警上限' })
  @Column({ type: 'decimal', name: 'alarm_max', precision: 10, scale: 2, comment: '报警上限', nullable: true })
  public alarmMax: number;

  @ApiProperty({ type: String, description: '报警下限' })
  @Column({ type: 'decimal', name: 'alarm_min', precision: 10, scale: 2, comment: '报警下限', nullable: true })
  public alarmMin: number;

  @ApiProperty({ type: String, description: '计量单位' })
  @Column({ type: 'varchar', name: 'unit', length: 20, comment: '计量单位(m³/h, MPa, m, mg/L等)', nullable: true })
  public unit: string;

  @ApiProperty({ type: String, description: '数据类型(int, float, bool)' })
  @Column({ type: 'varchar', name: 'data_type', length: 20, comment: '数据类型', default: 'float' })
  public dataType: string;

  @ApiProperty({ type: String, description: '读写属性(R/W)' })
  @Column({ type: 'varchar', name: 'rw_attr', length: 10, comment: '读写属性', default: 'R' })
  public rwAttr: string;

  @ApiProperty({ type: Number, description: '排序' })
  @Column({ type: 'int', name: 'sort', default: 0, comment: '排序' })
  public sort: number;

  @ApiProperty({ type: String, description: '状态（0正常 1报警 2离线）' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态' })
  public status: string;

  @ApiProperty({ type: String, description: '删除标志' })
  @Column({ type: 'char', name: 'del_flag', length: 1, default: '0', comment: '删除标志' })
  public delFlag: string;

  @ApiProperty({ type: Number, description: '部门ID' })
  @Column({ type: 'bigint', name: 'dept_id', comment: '部门ID', nullable: true })
  public deptId: number;

  @ApiProperty({ type: Number, description: '用户ID' })
  @Column({ type: 'bigint', name: 'user_id', comment: '用户ID', nullable: true })
  public userId: number;
}