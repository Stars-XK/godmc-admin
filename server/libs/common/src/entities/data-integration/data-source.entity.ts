import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_data_source', {
  comment: '【数据接入】数据源配置表',
})
export class DataIntegrationSourceEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '数据源ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '数据源ID' })
  public id: number;

  @ApiProperty({ type: String, description: '数据源名称' })
  @Column({ type: 'varchar', name: 'name', length: 100, comment: '数据源名称' })
  public name: string;

  @ApiProperty({ type: String, description: '数据源类型 (HTTP, MYSQL, POSTGRESQL, KAFKA, FILE)' })
  @Column({ type: 'varchar', name: 'type', length: 50, comment: '数据源类型' })
  public type: string;

  @ApiProperty({ type: String, description: '连接字符串或路径' })
  @Column({ type: 'varchar', name: 'connection_str', length: 500, comment: '连接字符串或路径', nullable: true })
  public connectionStr: string;

  @ApiProperty({ type: String, description: '用户名/认证信息' })
  @Column({ type: 'varchar', name: 'username', length: 100, comment: '用户名/认证信息', nullable: true })
  public username: string;

  @ApiProperty({ type: String, description: '密码/凭证' })
  @Column({ type: 'varchar', name: 'password', length: 100, comment: '密码/凭证', nullable: true })
  public password: string;
}