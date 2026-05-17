import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_check_item', {
  comment: '【巡检管理】检查项模板表',
})
export class InspectionCheckItemEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '检查项ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: Number, description: '所属检查点ID' })
  @Column({ type: 'bigint', name: 'checkpoint_id', comment: '所属检查点ID' })
  public checkpointId: number;

  @ApiProperty({ type: String, description: '检查项名称' })
  @Column({ type: 'varchar', name: 'item_name', length: 100, comment: '检查项名称' })
  public itemName: string;

  @ApiProperty({ type: String, description: '检查项类型（normal/threshold/select/photo/measurement/signature）' })
  @Column({ type: 'varchar', name: 'item_type', length: 20, default: 'normal', comment: '检查项类型' })
  public itemType: string;

  @ApiProperty({ type: String, description: '是否要求拍照（0否 1是）' })
  @Column({ type: 'char', name: 'require_photo', length: 1, default: '0', comment: '是否要求拍照' })
  public requirePhoto: string;

  @ApiProperty({ type: Number, description: '阈值下限（threshold类型时使用）' })
  @Column({ type: 'decimal', name: 'threshold_min', precision: 12, scale: 4, nullable: true, comment: '阈值下限' })
  public thresholdMin: number;

  @ApiProperty({ type: Number, description: '阈值上限（threshold类型时使用）' })
  @Column({ type: 'decimal', name: 'threshold_max', precision: 12, scale: 4, nullable: true, comment: '阈值上限' })
  public thresholdMax: number;

  @ApiProperty({ type: String, description: '阈值单位' })
  @Column({ type: 'varchar', name: 'threshold_unit', length: 20, default: '', comment: '阈值单位' })
  public thresholdUnit: string;

  @ApiProperty({ type: Object, description: '选择项列表(JSON数组)' })
  @Column({ type: 'json', name: 'select_options', nullable: true, comment: '选择项列表' })
  public selectOptions: string[];

  @ApiProperty({ type: String, description: '默认值' })
  @Column({ type: 'varchar', name: 'default_value', length: 255, default: '', comment: '默认值' })
  public defaultValue: string;

  @ApiProperty({ type: String, description: '是否必填（0否 1是）' })
  @Column({ type: 'char', name: 'is_required', length: 1, default: '1', comment: '是否必填' })
  public isRequired: string;

  @ApiProperty({ type: Number, description: '排序号' })
  @Column({ type: 'int', name: 'sort_order', default: 0, comment: '排序号' })
  public sortOrder: number;

  @ApiProperty({ type: String, description: '检查项说明' })
  @Column({ type: 'varchar', name: 'description', length: 500, default: '', comment: '检查项说明' })
  public description: string;
}
