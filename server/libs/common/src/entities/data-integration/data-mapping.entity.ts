import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_data_mapping', {
  comment: '【数据接入】字段映射规则表',
})
export class DataIntegrationMappingEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '映射ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '映射ID' })
  public id: number;

  @ApiProperty({ type: Number, description: '所属任务ID' })
  @Column({ type: 'bigint', name: 'task_id', comment: '所属任务ID' })
  public taskId: number;

  @ApiProperty({ type: String, description: '源数据字段名' })
  @Column({ type: 'varchar', name: 'source_field', length: 100, comment: '源数据字段名' })
  public sourceField: string;

  @ApiProperty({ type: String, description: '目标TDengine字段 (deviceCode, pointCode, value, timestamp)' })
  @Column({ type: 'varchar', name: 'target_field', length: 50, comment: '目标TDengine字段' })
  public targetField: string;

  @ApiProperty({ description: '是否作为更新依据(0否 1是)' })
  @Column({ name: 'is_update_key', type: 'tinyint', default: 0, comment: '是否作为更新依据(0否 1是)' })
  public isUpdateKey: number;

  @ApiProperty({ type: String, description: '值转换规则 (如 A=1,B=2)' })
  @Column({ name: 'transform_rule', type: 'varchar', length: 500, nullable: true, comment: '字典转换规则' })
  public transformRule: string;
}