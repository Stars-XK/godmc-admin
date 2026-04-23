import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';
import { dateTransformer } from '../utils/index';
import { ApiProperty } from '@nestjs/swagger';

// 状态
@Entity()
export abstract class BaseStatusEntity {
  //0正常 1停用
  @ApiProperty({ type: String, description: '状态' })
  @Column({ type: 'char', name: 'status', default: '0', length: 1, comment: '状态' })
  public status: string;
}

// 带删除标志的状态
@Entity()
export abstract class DeleteStatusEntity extends BaseStatusEntity {
  //0代表存在 1代表删除
  @ApiProperty({ type: String, description: '删除标志' })
  @Column({ type: 'char', name: 'del_flag', default: '0', length: 1, comment: '删除标志' })
  public delFlag: string;
}

//基础实体信息 (无逻辑删除字段)
@Entity()
export abstract class BaseEntity extends BaseStatusEntity {
  @ApiProperty({ type: String, description: '创建者' })
  @Column({ type: 'varchar', name: 'create_by', length: 64, default: '', comment: '创建者' })
  public createBy: string;

  @CreateDateColumn({ type: 'datetime', name: 'create_time', default: null, transformer: dateTransformer, comment: '创建时间' })
  public createTime: Date;

  @Column({ type: 'varchar', name: 'update_by', length: 64, default: '', comment: '更新者' })
  public updateBy: string;

  @UpdateDateColumn({ type: 'datetime', name: 'update_time', default: null, transformer: dateTransformer, comment: '更新时间' })
  public updateTime: Date;

  @Column({ type: 'varchar', name: 'remark', length: 500, default: null, comment: '备注' })
  public remark: string;
}

// 包含所有字段的完整基类 (含逻辑删除)
@Entity()
export abstract class FullBaseEntity extends DeleteStatusEntity {
  @ApiProperty({ type: String, description: '创建者' })
  @Column({ type: 'varchar', name: 'create_by', length: 64, default: '', comment: '创建者' })
  public createBy: string;

  @CreateDateColumn({ type: 'datetime', name: 'create_time', default: null, transformer: dateTransformer, comment: '创建时间' })
  public createTime: Date;

  @Column({ type: 'varchar', name: 'update_by', length: 64, default: '', comment: '更新者' })
  public updateBy: string;

  @UpdateDateColumn({ type: 'datetime', name: 'update_time', default: null, transformer: dateTransformer, comment: '更新时间' })
  public updateTime: Date;

  @Column({ type: 'varchar', name: 'remark', length: 500, default: null, comment: '备注' })
  public remark: string;
}
