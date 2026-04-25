import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { dateTransformer } from '../../utils';

@Entity('sys_alarm_rule', {
  comment: '报警规则配置表',
})
export class SysAlarmRuleEntity {
  @ApiProperty({ type: Number, description: '规则ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'rule_id', comment: '规则ID' })
  public ruleId: number;

  @ApiProperty({ type: String, description: '规则名称' })
  @Column({ type: 'varchar', name: 'rule_name', length: 100, comment: '规则名称' })
  public ruleName: string;

  @ApiProperty({ type: String, description: '规则类型(1-设备 2-分区 3-系统)' })
  @Column({ type: 'varchar', name: 'rule_type', length: 2, default: '1', comment: '规则类型(1-设备 2-分区 3-系统)' })
  public ruleType: string;

  @ApiProperty({ type: Object, description: '条件JSON' })
  @Column({ type: 'json', name: 'rule_conditions', comment: '条件JSON' })
  public ruleConditions: any;

  @ApiProperty({ type: Object, description: '动作JSON' })
  @Column({ type: 'json', name: 'rule_actions', comment: '动作JSON' })
  public ruleActions: any;

  @ApiProperty({ type: String, description: '状态(0正常 1停用)' })
  @Column({ type: 'char', name: 'status', length: 1, default: '0', comment: '状态(0正常 1停用)' })
  public status: string;

  @ApiProperty({ type: String, description: '创建者' })
  @Column({ type: 'varchar', name: 'create_by', length: 64, default: '', comment: '创建者' })
  public createBy: string;

  @ApiProperty({ type: Date, description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', name: 'create_time', default: null, transformer: dateTransformer, comment: '创建时间' })
  public createTime: Date;

  @ApiProperty({ type: String, description: '更新者' })
  @Column({ type: 'varchar', name: 'update_by', length: 64, default: '', comment: '更新者' })
  public updateBy: string;

  @ApiProperty({ type: Date, description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', name: 'update_time', default: null, transformer: dateTransformer, comment: '更新时间' })
  public updateTime: Date;

  @ApiProperty({ type: String, description: '备注' })
  @Column({ type: 'varchar', name: 'remark', length: 500, default: null, comment: '备注' })
  public remark: string;
}
