import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { dateTransformer } from '../../utils';

@Entity('sys_alarm_history', {
  comment: '报警历史记录表',
})
export class SysAlarmHistoryEntity {
  @ApiProperty({ type: Number, description: '报警ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'alarm_id', comment: '报警ID' })
  public alarmId: number;

  @ApiProperty({ type: Number, description: '规则ID' })
  @Column({ type: 'bigint', name: 'rule_id', comment: '规则ID' })
  public ruleId: number;

  @ApiProperty({ type: String, description: '规则名称' })
  @Column({ type: 'varchar', name: 'rule_name', length: 100, comment: '规则名称' })
  public ruleName: string;

  @ApiProperty({ type: String, description: '报警级别(1-紧急 2-重要 3-次要 4-提示)' })
  @Column({ type: 'varchar', name: 'alarm_level', length: 2, default: '3', comment: '报警级别' })
  public alarmLevel: string;

  @ApiProperty({ type: String, description: '报警内容' })
  @Column({ type: 'varchar', name: 'alarm_content', length: 500, comment: '报警内容' })
  public alarmContent: string;

  @ApiProperty({ type: Date, description: '报警时间' })
  @Column({ type: 'datetime', name: 'alarm_time', transformer: dateTransformer, comment: '报警时间' })
  public alarmTime: Date;

  @ApiProperty({ type: String, description: '报警源(如deviceCode或zoneCode)' })
  @Column({ type: 'varchar', name: 'alarm_source', length: 100, default: null, comment: '报警源' })
  public alarmSource: string;

  @ApiProperty({ type: String, description: '状态(0未处理 1已处理 2自动恢复)' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态(0未处理 1已处理 2自动恢复)' })
  public status: string;

  @ApiProperty({ type: Date, description: '处理时间' })
  @Column({ type: 'datetime', name: 'resolve_time', default: null, transformer: dateTransformer, comment: '处理时间' })
  public resolveTime: Date;

  @ApiProperty({ type: String, description: '处理人' })
  @Column({ type: 'varchar', name: 'resolve_by', length: 64, default: '', comment: '处理人' })
  public resolveBy: string;

  @ApiProperty({ type: String, description: '处理备注' })
  @Column({ type: 'varchar', name: 'resolve_remark', length: 500, default: null, comment: '处理备注' })
  public resolveRemark: string;
}
