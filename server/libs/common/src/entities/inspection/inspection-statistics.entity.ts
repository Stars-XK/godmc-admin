import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_statistics', {
  comment: '【巡检管理】巡检统计汇总表',
})
export class InspectionStatisticsEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '统计ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: String, description: '统计周期（day/week/month/quarter/year）' })
  @Column({ type: 'varchar', name: 'stat_period', length: 10, comment: '统计周期' })
  public statPeriod: string;

  @ApiProperty({ type: String, description: '统计日期（YYYY-MM-DD / YYYY-WW / YYYY-MM）' })
  @Column({ type: 'varchar', name: 'stat_date', length: 20, comment: '统计日期' })
  public statDate: string;

  @ApiProperty({ type: String, description: '统计类型（personal/dept/overall）' })
  @Column({ type: 'varchar', name: 'stat_type', length: 20, comment: '统计类型' })
  public statType: string;

  @ApiProperty({ type: Number, description: '用户ID（personal统计时）' })
  @Column({ type: 'int', name: 'user_id', nullable: true, comment: '用户ID' })
  public userId: number;

  @ApiProperty({ type: String, description: '用户姓名' })
  @Column({ type: 'varchar', name: 'user_name', length: 50, default: '', comment: '用户姓名' })
  public userName: string;

  @ApiProperty({ type: Number, description: '部门ID' })
  @Column({ type: 'int', name: 'dept_id', nullable: true, comment: '部门ID' })
  public deptId: number;

  @ApiProperty({ type: String, description: '部门名称' })
  @Column({ type: 'varchar', name: 'dept_name', length: 100, default: '', comment: '部门名称' })
  public deptName: string;

  @ApiProperty({ type: Number, description: '任务总数' })
  @Column({ type: 'int', name: 'total_tasks', default: 0, comment: '任务总数' })
  public totalTasks: number;

  @ApiProperty({ type: Number, description: '已完成任务数' })
  @Column({ type: 'int', name: 'completed_tasks', default: 0, comment: '已完成任务数' })
  public completedTasks: number;

  @ApiProperty({ type: Number, description: '超时任务数' })
  @Column({ type: 'int', name: 'overdue_tasks', default: 0, comment: '超时任务数' })
  public overdueTasks: number;

  @ApiProperty({ type: Number, description: '发现的问题总数' })
  @Column({ type: 'int', name: 'total_issues', default: 0, comment: '发现的问题总数' })
  public totalIssues: number;

  @ApiProperty({ type: Number, description: '严重问题数' })
  @Column({ type: 'int', name: 'critical_issues', default: 0, comment: '严重问题数' })
  public criticalIssues: number;

  @ApiProperty({ type: Number, description: '已解决问题数' })
  @Column({ type: 'int', name: 'resolved_issues', default: 0, comment: '已解决问题数' })
  public resolvedIssues: number;

  @ApiProperty({ type: Number, description: '平均完成时间(分钟)' })
  @Column({ type: 'decimal', name: 'avg_completion_time', precision: 8, scale: 2, default: 0.00, comment: '平均完成时间(分钟)' })
  public avgCompletionTime: number;

  @ApiProperty({ type: Number, description: '巡检总里程(公里)' })
  @Column({ type: 'decimal', name: 'total_distance', precision: 10, scale: 2, default: 0.00, comment: '巡检总里程(公里)' })
  public totalDistance: number;

  @ApiProperty({ type: Number, description: '照片总数' })
  @Column({ type: 'int', name: 'total_photos', default: 0, comment: '照片总数' })
  public totalPhotos: number;

  @ApiProperty({ type: String, description: '完成率' })
  @Column({ type: 'decimal', name: 'completion_rate', precision: 5, scale: 2, default: 0.00, comment: '完成率(%)' })
  public completionRate: number;
}
