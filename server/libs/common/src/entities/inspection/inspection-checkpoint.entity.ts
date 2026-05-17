import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_checkpoint', {
  comment: '【巡检管理】检查点表',
})
export class InspectionCheckpointEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '检查点ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: String, description: '检查点名称' })
  @Column({ type: 'varchar', name: 'checkpoint_name', length: 100, comment: '检查点名称' })
  public checkpointName: string;

  @ApiProperty({ type: String, description: '检查点编码' })
  @Column({ type: 'varchar', name: 'checkpoint_code', length: 50, default: '', comment: '检查点编码' })
  public checkpointCode: string;

  @ApiProperty({ type: String, description: '检查点类型（visual/meter_reading/equipment/env/safety/other）' })
  @Column({ type: 'varchar', name: 'checkpoint_type', length: 30, default: 'visual', comment: '检查点类型' })
  public checkpointType: string;

  @ApiProperty({ type: String, description: '关联水务实体的类型（zone/station/device/pipe/point）' })
  @Column({ type: 'varchar', name: 'ref_type', length: 30, nullable: true, comment: '关联水务实体的类型' })
  public refType: string;

  @ApiProperty({ type: String, description: '关联水务实体的编码' })
  @Column({ type: 'varchar', name: 'ref_code', length: 50, nullable: true, comment: '关联水务实体的编码' })
  public refCode: string;

  @ApiProperty({ type: String, description: '关联水务实体的名称' })
  @Column({ type: 'varchar', name: 'ref_name', length: 100, default: '', comment: '关联水务实体的名称' })
  public refName: string;

  @ApiProperty({ type: String, description: '经度' })
  @Column({ type: 'varchar', name: 'lng', length: 30, default: '', comment: '经度' })
  public lng: string;

  @ApiProperty({ type: String, description: '纬度' })
  @Column({ type: 'varchar', name: 'lat', length: 30, default: '', comment: '纬度' })
  public lat: string;

  @ApiProperty({ type: String, description: '位置描述/地址' })
  @Column({ type: 'varchar', name: 'address', length: 255, default: '', comment: '位置描述' })
  public address: string;

  @ApiProperty({ type: Number, description: '在路线中的排序号' })
  @Column({ type: 'int', name: 'sort_order', default: 0, comment: '在路线中的排序号' })
  public sortOrder: number;

  @ApiProperty({ type: Number, description: '检查项数量' })
  @Column({ type: 'int', name: 'check_item_count', default: 0, comment: '检查项数量' })
  public checkItemCount: number;

  @ApiProperty({ type: Number, description: '所属部门ID' })
  @Column({ type: 'int', name: 'dept_id', nullable: true, comment: '所属部门ID' })
  public deptId: number;
}
