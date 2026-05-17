import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_plan', {
  comment: '【巡检管理】巡检计划模板表',
})
export class InspectionPlanEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '计划ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: String, description: '计划名称' })
  @Column({ type: 'varchar', name: 'plan_name', length: 100, comment: '计划名称' })
  public planName: string;

  @ApiProperty({ type: String, description: '计划编码' })
  @Column({ type: 'varchar', name: 'plan_code', length: 50, default: '', comment: '计划编码' })
  public planCode: string;

  @ApiProperty({ type: String, description: '巡检类型（daily/weekly/monthly/quarterly/yearly/custom）' })
  @Column({ type: 'varchar', name: 'plan_type', length: 20, default: 'daily', comment: '巡检类型' })
  public planType: string;

  @ApiProperty({ type: String, description: '调度Cron表达式' })
  @Column({ type: 'varchar', name: 'schedule_cron', length: 50, default: '', comment: '调度Cron表达式' })
  public scheduleCron: string;

  @ApiProperty({ type: Number, description: '关联路线ID' })
  @Column({ type: 'bigint', name: 'route_id', nullable: true, comment: '关联路线ID' })
  public routeId: number;

  @ApiProperty({ type: String, description: '指派的巡检员ID列表(JSON数组)' })
  @Column({ type: 'json', name: 'assigned_user_ids', nullable: true, comment: '指派的巡检员ID列表' })
  public assignedUserIds: number[];

  @ApiProperty({ type: String, description: '计划状态（draft/active/paused/archived）' })
  @Column({ type: 'varchar', name: 'plan_status', length: 20, default: 'draft', comment: '计划状态' })
  public planStatus: string;

  @ApiProperty({ type: Date, description: '开始日期' })
  @Column({ type: 'date', name: 'start_date', nullable: true, comment: '开始日期' })
  public startDate: Date;

  @ApiProperty({ type: Date, description: '结束日期' })
  @Column({ type: 'date', name: 'end_date', nullable: true, comment: '结束日期' })
  public endDate: Date;

  @ApiProperty({ type: String, description: '计划描述' })
  @Column({ type: 'varchar', name: 'description', length: 500, default: '', comment: '计划描述' })
  public description: string;

  @ApiProperty({ type: Number, description: '提前生成天数' })
  @Column({ type: 'int', name: 'advance_days', default: 7, comment: '提前生成天数' })
  public advanceDays: number;

  @ApiProperty({ type: Number, description: '任务超时小时数' })
  @Column({ type: 'int', name: 'overdue_hours', default: 2, comment: '任务超时小时数' })
  public overdueHours: number;

  @ApiProperty({ type: Number, description: '所属部门ID' })
  @Column({ type: 'int', name: 'dept_id', nullable: true, comment: '所属部门ID' })
  public deptId: number;

  @ApiProperty({ type: Number, description: '显示顺序' })
  @Column({ type: 'int', name: 'sort', default: 0, comment: '排序号' })
  public sort: number;
}
