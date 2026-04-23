import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FullBaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_station', {
  comment: '【水务基础】站点信息表',
})
export class WaterStationEntity extends FullBaseEntity {
  @ApiProperty({ type: Number, description: '站点ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '站点ID' })
  public id: number;

  @ApiProperty({ type: String, description: '站点名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '站点名称' })
  public name: string;

  @ApiProperty({ type: String, description: '站点编码' })
  @Column({ type: 'varchar', name: 'code', length: 50, comment: '站点编码' })
  public code: string;

  @ApiProperty({ type: String, description: '站点类型(水厂/泵站/水库等)' })
  @Column({ type: 'varchar', name: 'type', length: 20, comment: '站点类型', default: 'OTHER' })
  public type: string;

  @ApiProperty({ type: String, description: '所属分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '所属分区编码', nullable: true })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '负责人' })
  @Column({ type: 'varchar', name: 'manager_name', length: 50, comment: '负责人', nullable: true })
  public managerName: string;

  @ApiProperty({ type: String, description: '负责人电话' })
  @Column({ type: 'varchar', name: 'manager_phone', length: 20, comment: '负责人电话', nullable: true })
  public managerPhone: string;

  @ApiProperty({ type: String, description: '经度' })
  @Column({ type: 'varchar', name: 'longitude', length: 30, comment: '经度', nullable: true })
  public longitude: string;

  @ApiProperty({ type: String, description: '纬度' })
  @Column({ type: 'varchar', name: 'latitude', length: 30, comment: '纬度', nullable: true })
  public latitude: string;

  @ApiProperty({ type: String, description: '详细地址' })
  @Column({ type: 'varchar', name: 'address', length: 255, comment: '详细地址', nullable: true })
  public address: string;

  @ApiProperty({ type: String, description: '建设单位' })
  @Column({ type: 'varchar', name: 'construction_unit', length: 100, comment: '建设单位', nullable: true })
  public constructionUnit: string;

  @ApiProperty({ type: Date, description: '投运日期' })
  @Column({ type: 'datetime', name: 'commissioning_date', comment: '投运日期', nullable: true })
  public commissioningDate: Date;

  @ApiProperty({ type: Number, description: '设计能力(m³/d等)' })
  @Column({ type: 'decimal', name: 'design_capacity', precision: 10, scale: 2, comment: '设计能力', nullable: true })
  public designCapacity: number;

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
