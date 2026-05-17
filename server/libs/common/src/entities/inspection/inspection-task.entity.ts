import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_task', {
  comment: '【巡检管理】巡检任务实例表',
})
export class InspectionTaskEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '任务ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: String, description: '任务编号（IT-YYYYMMDD-XXXXX）' })
  @Column({ type: 'varchar', name: 'task_code', length: 30, comment: '任务编号' })
  public taskCode: string;

  @ApiProperty({ type: String, description: '任务名称' })
  @Column({ type: 'varchar', name: 'task_name', length: 200, comment: '任务名称' })
  public taskName: string;

  @ApiProperty({ type: Number, description: '关联计划ID' })
  @Column({ type: 'bigint', name: 'plan_id', nullable: true, comment: '关联计划ID' })
  public planId: number;

  @ApiProperty({ type: Number, description: '关联路线ID' })
  @Column({ type: 'bigint', name: 'route_id', nullable: true, comment: '关联路线ID' })
  public routeId: number;

  @ApiProperty({ type: Number, description: '指派的巡检员ID' })
  @Column({ type: 'int', name: 'assigned_user_id', comment: '指派的巡检员ID' })
  public assignedUserId: number;

  @ApiProperty({ type: String, description: '巡检员姓名' })
  @Column({ type: 'varchar', name: 'assigned_user_name', length: 50, default: '', comment: '巡检员姓名' })
  public assignedUserName: string;

  @ApiProperty({ type: String, description: '任务状态（pending/accepted/in_progress/submitted/reviewed/closed/overdue）' })
  @Column({ type: 'varchar', name: 'task_status', length: 20, default: 'pending', comment: '任务状态' })
  public taskStatus: string;

  @ApiProperty({ type: Number, description: '完成比例（0-100）' })
  @Column({ type: 'int', name: 'completion_ratio', default: 0, comment: '完成比例' })
  public completionRatio: number;

  @ApiProperty({ type: Date, description: '截止时间' })
  @Column({ type: 'datetime', name: 'deadline', comment: '截止时间' })
  public deadline: Date;

  @ApiProperty({ type: String, description: '是否已超时升级（0否 1是）' })
  @Column({ type: 'char', name: 'overdue_escalated', length: 1, default: '0', comment: '是否已超时升级' })
  public overdueEscalated: string;

  @ApiProperty({ type: Date, description: '实际开始时间' })
  @Column({ type: 'datetime', name: 'actual_start_time', nullable: true, comment: '实际开始时间' })
  public actualStartTime: Date;

  @ApiProperty({ type: Date, description: '实际结束时间' })
  @Column({ type: 'datetime', name: 'actual_end_time', nullable: true, comment: '实际结束时间' })
  public actualEndTime: Date;

  @ApiProperty({ type: Date, description: '提交时间' })
  @Column({ type: 'datetime', name: 'submitted_at', nullable: true, comment: '提交时间' })
  public submittedAt: Date;

  @ApiProperty({ type: Number, description: '检查点总数' })
  @Column({ type: 'int', name: 'total_checkpoints', default: 0, comment: '检查点总数' })
  public totalCheckpoints: number;

  @ApiProperty({ type: Number, description: '已完成检查点数' })
  @Column({ type: 'int', name: 'completed_checkpoints', default: 0, comment: '已完成检查点数' })
  public completedCheckpoints: number;

  @ApiProperty({ type: String, description: '巡检备注' })
  @Column({ type: 'varchar', name: 'remark', length: 500, default: null, comment: '备注' })
  public remark: string;
}
