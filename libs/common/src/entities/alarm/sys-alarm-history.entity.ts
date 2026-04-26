import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_alarm_history')
export class SysAlarmHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'alarm_id' })
  alarmId: number;

  @Column({ type: 'bigint', name: 'rule_id' })
  ruleId: number;

  @Column({ type: 'varchar', name: 'rule_name', length: 100 })
  ruleName: string;

  @Column({ type: 'varchar', name: 'alarm_level', length: 2, default: '3' })
  alarmLevel: string;

  @Column({ type: 'varchar', name: 'alarm_content', length: 500 })
  alarmContent: string;

  @Column({ type: 'datetime', name: 'alarm_time', default: () => 'CURRENT_TIMESTAMP' })
  alarmTime: Date;

  @Column({ type: 'varchar', name: 'alarm_source', length: 100, nullable: true })
  alarmSource: string;

  @Column({ type: 'char', name: 'status', length: 1, default: '0' })
  status: string;

  @Column({ type: 'datetime', name: 'resolve_time', nullable: true })
  resolveTime: Date;

  @Column({ type: 'varchar', name: 'resolve_by', length: 64, default: '' })
  resolveBy: string;

  @Column({ type: 'varchar', name: 'resolve_remark', length: 500, nullable: true })
  resolveRemark: string;
}
