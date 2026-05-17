import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_issue', {
  comment: '【巡检管理】巡检问题表',
})
export class InspectionIssueEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '问题ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: Number, description: '所属任务ID' })
  @Column({ type: 'bigint', name: 'task_id', nullable: true, comment: '所属任务ID' })
  public taskId: number;

  @ApiProperty({ type: Number, description: '关联巡检记录ID' })
  @Column({ type: 'bigint', name: 'record_id', nullable: true, comment: '关联巡检记录ID' })
  public recordId: number;

  @ApiProperty({ type: Number, description: '关联检查点ID' })
  @Column({ type: 'bigint', name: 'checkpoint_id', nullable: true, comment: '关联检查点ID' })
  public checkpointId: number;

  @ApiProperty({ type: String, description: '问题编号' })
  @Column({ type: 'varchar', name: 'issue_code', length: 30, default: '', comment: '问题编号' })
  public issueCode: string;

  @ApiProperty({ type: String, description: '问题标题' })
  @Column({ type: 'varchar', name: 'issue_title', length: 200, comment: '问题标题' })
  public issueTitle: string;

  @ApiProperty({ type: String, description: '问题描述' })
  @Column({ type: 'text', name: 'issue_description', nullable: true, comment: '问题描述' })
  public issueDescription: string;

  @ApiProperty({ type: String, description: '严重程度（1严重 2重要 3一般 4观察）' })
  @Column({ type: 'char', name: 'severity', length: 1, default: '3', comment: '严重程度' })
  public severity: string;

  @ApiProperty({ type: String, description: '问题状态（open/acknowledged/in_progress/resolved/closed/verified）' })
  @Column({ type: 'varchar', name: 'issue_status', length: 20, default: 'open', comment: '问题状态' })
  public issueStatus: string;

  @ApiProperty({ type: Number, description: '关联报警记录ID' })
  @Column({ type: 'bigint', name: 'linked_alarm_id', nullable: true, comment: '关联报警记录ID' })
  public linkedAlarmId: number;

  @ApiProperty({ type: String, description: '关联工单编号' })
  @Column({ type: 'varchar', name: 'linked_work_order_id', length: 50, nullable: true, comment: '关联工单编号' })
  public linkedWorkOrderId: string;

  @ApiProperty({ type: String, description: '问题照片URL列表(JSON数组)' })
  @Column({ type: 'json', name: 'photo_urls', nullable: true, comment: '问题照片URL列表' })
  public photoUrls: string[];

  @ApiProperty({ type: String, description: '经度' })
  @Column({ type: 'varchar', name: 'lng', length: 30, default: '', comment: '经度' })
  public lng: string;

  @ApiProperty({ type: String, description: '纬度' })
  @Column({ type: 'varchar', name: 'lat', length: 30, default: '', comment: '纬度' })
  public lat: string;

  @ApiProperty({ type: Number, description: '上报人ID' })
  @Column({ type: 'int', name: 'reporter_id', comment: '上报人ID' })
  public reporterId: number;

  @ApiProperty({ type: String, description: '上报人姓名' })
  @Column({ type: 'varchar', name: 'reporter_name', length: 50, default: '', comment: '上报人姓名' })
  public reporterName: string;

  @ApiProperty({ type: Number, description: '处理人ID' })
  @Column({ type: 'int', name: 'assignee_id', nullable: true, comment: '处理人ID' })
  public assigneeId: number;

  @ApiProperty({ type: String, description: '处理人姓名' })
  @Column({ type: 'varchar', name: 'assignee_name', length: 50, default: '', comment: '处理人姓名' })
  public assigneeName: string;

  @ApiProperty({ type: Date, description: '解决时间' })
  @Column({ type: 'datetime', name: 'resolved_at', nullable: true, comment: '解决时间' })
  public resolvedAt: Date;

  @ApiProperty({ type: Date, description: '验证时间' })
  @Column({ type: 'datetime', name: 'verified_at', nullable: true, comment: '验证时间' })
  public verifiedAt: Date;

  @ApiProperty({ type: String, description: '处理备注' })
  @Column({ type: 'text', name: 'resolution', nullable: true, comment: '处理备注' })
  public resolution: string;
}
