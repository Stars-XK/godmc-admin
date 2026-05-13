import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_pipe', {
  comment: '【水务基础】管网管线信息表',
})
export class WaterPipeEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '管线ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '管线ID' })
  public id: number;

  @ApiProperty({ type: String, description: '管线名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '管线名称' })
  public name: string;

  @ApiProperty({ type: String, description: '管线编码' })
  @Column({ type: 'varchar', name: 'code', length: 50, comment: '管线编码' })
  public code: string;

  @ApiProperty({ type: String, description: '管线类型(供水/排水/污水等)' })
  @Column({ type: 'varchar', name: 'pipe_type', length: 20, comment: '管线类型', default: 'WATER_SUPPLY' })
  public pipeType: string;

  @ApiProperty({ type: String, description: '管材(PVC/PE/铸铁/钢管等)' })
  @Column({ type: 'varchar', name: 'material', length: 20, comment: '管材', nullable: true })
  public material: string;

  @ApiProperty({ type: Number, description: '管径(mm)' })
  @Column({ type: 'decimal', name: 'diameter', precision: 10, scale: 2, comment: '管径(mm)', nullable: true })
  public diameter: number;

  @ApiProperty({ type: Number, description: '管线长度(m)' })
  @Column({ type: 'decimal', name: 'length', precision: 10, scale: 2, comment: '管线长度(m)', nullable: true })
  public length: number;

  @ApiProperty({ type: String, description: '起点节点名称' })
  @Column({ type: 'varchar', name: 'start_node', length: 100, comment: '起点节点名称', nullable: true })
  public startNode: string;

  @ApiProperty({ type: String, description: '终点节点名称' })
  @Column({ type: 'varchar', name: 'end_node', length: 100, comment: '终点节点名称', nullable: true })
  public endNode: string;

  @ApiProperty({ type: Number, description: '埋深(m)' })
  @Column({ type: 'decimal', name: 'burial_depth', precision: 5, scale: 2, comment: '埋深(m)', nullable: true })
  public burialDepth: number;

  @ApiProperty({ type: Date, description: '铺设日期' })
  @Column({ type: 'datetime', name: 'install_date', comment: '铺设日期', nullable: true })
  public installDate: Date;

  @ApiProperty({ type: String, description: '管线路径坐标(JSON数组)' })
  @Column({ type: 'text', name: 'coordinates', comment: '管线路径坐标(JSON数组)', nullable: true })
  public coordinates: string;

  @ApiProperty({ type: String, description: '所属分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '所属分区编码', nullable: true })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '施工单位' })
  @Column({ type: 'varchar', name: 'construction_unit', length: 100, comment: '施工单位', nullable: true })
  public constructionUnit: string;

  @ApiProperty({ type: Number, description: '排序' })
  @Column({ type: 'int', name: 'sort', default: 0, comment: '排序' })
  public sort: number;

  @ApiProperty({ type: String, description: '状态（0正常 1停用）' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态（0正常 1停用）' })
  public status: string;

  @ApiProperty({ type: String, description: '删除标志（0代表存在 2代表删除）' })
  @Column({ type: 'char', name: 'del_flag', length: 1, default: '0', comment: '删除标志（0代表存在 1代表删除）' })
  public delFlag: string;

  @ApiProperty({ type: Number, description: '部门ID' })
  @Column({ type: 'bigint', name: 'dept_id', comment: '部门ID', nullable: true })
  public deptId: number;

  @ApiProperty({ type: Number, description: '用户ID' })
  @Column({ type: 'bigint', name: 'user_id', comment: '用户ID', nullable: true })
  public userId: number;
}
