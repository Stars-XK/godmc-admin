import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_zone', {
  comment: '综合水务分区表',
})
export class WaterZoneEntity extends BaseEntity {
  @ApiProperty({ type: String, description: '分区ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: String, description: '父级分区ID' })
  @Column({ type: 'bigint', name: 'parent_id', default: 0, comment: '父级分区ID' })
  public parentId: number;

  @ApiProperty({ type: String, description: '祖级列表' })
  @Column({ type: 'varchar', name: 'ancestors', length: 255, default: '', comment: '祖级列表' })
  public ancestors: string;

  @ApiProperty({ type: String, description: '分区维度' })
  @Column({ type: 'char', name: 'type', length: 1, default: '1', comment: '分区维度（1:行政营业, 2:DMA漏损, 3:控压高程, 4:供水调度）' })
  public type: string;

  @ApiProperty({ type: Number, description: '分区级别' })
  @Column({ type: 'int', name: 'level', default: 1, comment: '分区级别' })
  public level: number;

  @ApiProperty({ type: String, description: '分区名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '分区名称' })
  public name: string;

  @ApiProperty({ type: String, description: '分区编码' })
  @Column({ type: 'varchar', name: 'code', length: 50, default: '', comment: '分区编码' })
  public code: string;

  @ApiProperty({ type: Number, description: '覆盖面积(平方公里)' })
  @Column({ type: 'decimal', name: 'area', precision: 10, scale: 2, default: 0.00, comment: '覆盖面积(平方公里)' })
  public area: number;

  @ApiProperty({ type: Number, description: '服务人口' })
  @Column({ type: 'int', name: 'population', default: 0, comment: '服务人口' })
  public population: number;

  @ApiProperty({ type: String, description: '位置描述' })
  @Column({ type: 'varchar', name: 'address', length: 255, default: '', comment: '位置描述' })
  public address: string;

  @ApiProperty({ type: Number, description: '所属部门ID' })
  @Column({ type: 'int', name: 'dept_id', nullable: true, comment: '所属部门ID' })
  public deptId: number;

  @ApiProperty({ type: Number, description: '负责人ID' })
  @Column({ type: 'int', name: 'user_id', nullable: true, comment: '负责人ID' })
  public userId: number;

  @ApiProperty({ type: String, description: '负责人姓名' })
  @Column({ type: 'varchar', name: 'manager_name', length: 50, default: '', comment: '负责人姓名' })
  public managerName: string;

  @ApiProperty({ type: String, description: '负责人电话' })
  @Column({ type: 'varchar', name: 'manager_phone', length: 20, default: '', comment: '负责人电话' })
  public managerPhone: string;

  @ApiProperty({ type: String, description: '中心经度' })
  @Column({ type: 'varchar', name: 'longitude', length: 30, default: '', comment: '中心经度' })
  public longitude: string;

  @ApiProperty({ type: String, description: '中心纬度' })
  @Column({ type: 'varchar', name: 'latitude', length: 30, default: '', comment: '中心纬度' })
  public latitude: string;

  @ApiProperty({ type: String, description: '地理边界信息(GeoJSON)' })
  @Column({ type: 'longtext', name: 'boundary', nullable: true, comment: '地理边界信息(GeoJSON)' })
  public boundary: string;

  @ApiProperty({ type: Number, description: '显示顺序' })
  @Column({ type: 'int', name: 'sort', default: 0, comment: '排序号' })
  public sort: number;
}
