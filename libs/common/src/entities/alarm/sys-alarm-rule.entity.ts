import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_alarm_rule')
export class SysAlarmRuleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'rule_id', comment: '规则ID' })
  ruleId: number;

  @Column({ type: 'varchar', name: 'rule_name', length: 100, comment: '规则名称' })
  ruleName: string;

  @Column({ type: 'varchar', name: 'rule_type', length: 2, default: '1', comment: '规则类型' })
  ruleType: string;

  @Column({ type: 'json', name: 'rule_conditions', comment: '条件JSON' })
  ruleConditions: any;

  @Column({ type: 'json', name: 'rule_actions', comment: '动作JSON' })
  ruleActions: any;

  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态' })
  status: string;

  @Column({ type: 'varchar', name: 'create_by', length: 64, default: '', comment: '创建者' })
  createBy: string;

  @Column({ type: 'datetime', name: 'create_time', default: () => 'CURRENT_TIMESTAMP' })
  createTime: Date;

  @Column({ type: 'varchar', name: 'update_by', length: 64, default: '' })
  updateBy: string;

  @Column({ type: 'datetime', name: 'update_time', nullable: true })
  updateTime: Date;

  @Column({ type: 'varchar', name: 'remark', length: 500, nullable: true })
  remark: string;
}
