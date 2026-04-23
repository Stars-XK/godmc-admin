import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FullBaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_device', {
  comment: '【水务基础】设备信息表',
})
export class WaterDeviceEntity extends FullBaseEntity {
  @ApiProperty({ type: Number, description: '设备ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '设备ID' })
  public id: number;

  @ApiProperty({ type: String, description: '设备名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '设备名称' })
  public name: string;

  @ApiProperty({ type: String, description: '设备编码' })
  @Column({ type: 'varchar', name: 'code', length: 50, comment: '设备编码' })
  public code: string;

  @ApiProperty({ type: String, description: '所属站点编码' })
  @Column({ type: 'varchar', name: 'station_code', length: 50, comment: '所属站点编码', nullable: true })
  public stationCode: string;

  @ApiProperty({ type: String, description: '所属分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '所属分区编码', nullable: true })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '设备类型(水泵/阀门/流量计等)' })
  @Column({ type: 'varchar', name: 'type', length: 20, comment: '设备类型', default: 'OTHER' })
  public type: string;

  @ApiProperty({ type: Number, description: '预期数据周期(分钟)', required: false })
  @Column({ type: 'int', name: 'expected_cycle', comment: '预期数据周期(分钟)', nullable: true })
  public expectedCycle: number;

  @ApiProperty({ type: String, description: '设备型号' })
  @Column({ type: 'varchar', name: 'model', length: 100, comment: '设备型号', nullable: true })
  public model: string;

  @ApiProperty({ type: String, description: '生产厂家' })
  @Column({ type: 'varchar', name: 'manufacturer', length: 100, comment: '生产厂家', nullable: true })
  public manufacturer: string;

  @ApiProperty({ type: Date, description: '安装日期' })
  @Column({ type: 'datetime', name: 'install_date', comment: '安装日期', nullable: true })
  public installDate: Date;

  @ApiProperty({ type: Number, description: '设计寿命(年)' })
  @Column({ type: 'int', name: 'lifespan', comment: '设计寿命(年)', nullable: true })
  public lifespan: number;

  @ApiProperty({ type: String, description: '额定功率(kW)' })
  @Column({ type: 'varchar', name: 'power', length: 50, comment: '额定功率(kW)', nullable: true })
  public power: string;

  @ApiProperty({ type: String, description: '负责人' })
  @Column({ type: 'varchar', name: 'manager_name', length: 50, comment: '负责人', nullable: true })
  public managerName: string;

  @ApiProperty({ type: String, description: '负责人电话' })
  @Column({ type: 'varchar', name: 'manager_phone', length: 20, comment: '负责人电话', nullable: true })
  public managerPhone: string;

  @ApiProperty({ type: Number, description: '排序' })
  @Column({ type: 'int', name: 'sort', default: 0, comment: '排序' })
  public sort: number;

  @ApiProperty({ type: String, description: '状态（0正常 1故障 2离线）' })
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
