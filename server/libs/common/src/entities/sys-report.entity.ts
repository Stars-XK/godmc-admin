import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base';
import { dateTransformer } from '../utils/index';

@Entity('sys_report', { comment: '专题报告表' })
export class SysReportEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '报告ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'report_id', comment: '报告ID' })
  public reportId: number;

  @ApiProperty({ type: String, description: '报告标题' })
  @Column({ type: 'varchar', name: 'title', length: 200, comment: '报告标题' })
  public title: string;

  @ApiProperty({ type: String, description: '报告类型' })
  @Column({ type: 'varchar', name: 'report_type', length: 50, comment: '报告类型(monthly_ops/device_ops/alarm_analysis/zone_water/revenue/custom)' })
  public reportType: string;

  @ApiProperty({ type: String, description: '报告周期' })
  @Column({ type: 'varchar', name: 'report_period', length: 20, comment: '报告周期(YYYY-MM或YYYY-MM-DD)' })
  public reportPeriod: string;

  @ApiProperty({ type: String, description: '报告摘要' })
  @Column({ type: 'varchar', name: 'summary', length: 500, default: '', comment: '报告摘要' })
  public summary: string;

  @ApiProperty({ type: String, description: '报告内容(JSON)' })
  @Column({ type: 'longtext', name: 'content', comment: '报告内容(JSON: sections数组)' })
  public content: string;

  @ApiProperty({ type: String, description: '封面图片URL' })
  @Column({ type: 'varchar', name: 'cover_image', length: 500, default: '', comment: '封面图片URL' })
  public coverImage: string;

  @ApiProperty({ type: String, description: '导出文件URL' })
  @Column({ type: 'varchar', name: 'file_url', length: 500, default: '', comment: '导出文件URL' })
  public fileUrl: string;

  @ApiProperty({ type: String, description: '报告标签(逗号分隔)' })
  @Column({ type: 'varchar', name: 'tags', length: 300, default: '', comment: '报告标签' })
  public tags: string;

  @ApiProperty({ type: String, description: '报告状态(draft/published/archived)' })
  @Column({ type: 'varchar', name: 'report_status', length: 20, default: 'draft', comment: '报告状态(draft/published/archived)' })
  public reportStatus: string;

  @ApiProperty({ type: Number, description: '浏览次数' })
  @Column({ type: 'int', name: 'view_count', default: 0, comment: '浏览次数' })
  public viewCount: number;

  @ApiProperty({ type: Date, description: '生成时间' })
  @Column({ type: 'datetime', name: 'generate_time', default: null, transformer: dateTransformer, comment: '生成时间' })
  public generateTime: Date;
}
