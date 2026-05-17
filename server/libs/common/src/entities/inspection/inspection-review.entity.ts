import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_review', {
  comment: '【巡检管理】审核记录表',
})
export class InspectionReviewEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '审核ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: Number, description: '关联任务ID' })
  @Column({ type: 'bigint', name: 'task_id', comment: '关联任务ID' })
  public taskId: number;

  @ApiProperty({ type: Number, description: '审核人ID' })
  @Column({ type: 'int', name: 'reviewer_id', comment: '审核人ID' })
  public reviewerId: number;

  @ApiProperty({ type: String, description: '审核人姓名' })
  @Column({ type: 'varchar', name: 'reviewer_name', length: 50, default: '', comment: '审核人姓名' })
  public reviewerName: string;

  @ApiProperty({ type: String, description: '审核结果（approved/rejected/returned）' })
  @Column({ type: 'varchar', name: 'review_result', length: 20, comment: '审核结果' })
  public reviewResult: string;

  @ApiProperty({ type: String, description: '审核意见' })
  @Column({ type: 'text', name: 'review_comment', nullable: true, comment: '审核意见' })
  public reviewComment: string;

  @ApiProperty({ type: Date, description: '审核时间' })
  @Column({ type: 'datetime', name: 'reviewed_at', comment: '审核时间' })
  public reviewedAt: Date;
}
