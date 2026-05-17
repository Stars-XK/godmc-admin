import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_record', {
  comment: '【巡检管理】巡检记录表（核心上报数据）',
})
export class InspectionRecordEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '记录ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: Number, description: '所属任务ID' })
  @Column({ type: 'bigint', name: 'task_id', comment: '所属任务ID' })
  public taskId: number;

  @ApiProperty({ type: Number, description: '所属检查点ID' })
  @Column({ type: 'bigint', name: 'checkpoint_id', comment: '所属检查点ID' })
  public checkpointId: number;

  @ApiProperty({ type: Number, description: '所属检查项ID' })
  @Column({ type: 'bigint', name: 'check_item_id', comment: '所属检查项ID' })
  public checkItemId: number;

  @ApiProperty({ type: String, description: '检查结果（normal/abnormal/skipped）' })
  @Column({ type: 'varchar', name: 'check_result', length: 20, comment: '检查结果' })
  public checkResult: string;

  @ApiProperty({ type: String, description: '检查值（文本/数值）' })
  @Column({ type: 'text', name: 'item_value', nullable: true, comment: '检查值' })
  public itemValue: string;

  @ApiProperty({ type: Object, description: '照片URL列表(JSON数组)' })
  @Column({ type: 'json', name: 'photo_urls', nullable: true, comment: '照片URL列表' })
  public photoUrls: string[];

  @ApiProperty({ type: String, description: '拍照时经度' })
  @Column({ type: 'varchar', name: 'lng', length: 30, default: '', comment: '拍照时经度' })
  public lng: string;

  @ApiProperty({ type: String, description: '拍照时纬度' })
  @Column({ type: 'varchar', name: 'lat', length: 30, default: '', comment: '拍照时纬度' })
  public lat: string;

  @ApiProperty({ type: Number, description: '海拔高度(米)' })
  @Column({ type: 'decimal', name: 'altitude', precision: 8, scale: 2, nullable: true, comment: '海拔高度(米)' })
  public altitude: number;

  @ApiProperty({ type: String, description: '电子签名图片URL' })
  @Column({ type: 'varchar', name: 'signature_url', length: 255, default: '', comment: '电子签名图片URL' })
  public signatureUrl: string;

  @ApiProperty({ type: String, description: '同步状态（0已同步 1待同步）' })
  @Column({ type: 'char', name: 'sync_status', length: 1, default: '0', comment: '同步状态' })
  public syncStatus: string;

  @ApiProperty({ type: String, description: '异常描述' })
  @Column({ type: 'text', name: 'abnormal_desc', nullable: true, comment: '异常描述' })
  public abnormalDesc: string;

  @ApiProperty({ type: Number, description: '提交人ID' })
  @Column({ type: 'int', name: 'submit_user_id', comment: '提交人ID' })
  public submitUserId: number;

  @ApiProperty({ type: Date, description: '提交时间' })
  @Column({ type: 'datetime', name: 'submitted_at', nullable: true, comment: '提交时间' })
  public submittedAt: Date;
}
