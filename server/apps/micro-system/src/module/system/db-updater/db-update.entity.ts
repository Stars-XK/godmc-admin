import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sys_db_updates')
export class SysDbUpdateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filename', length: 255, unique: true })
  filename: string;

  @Column({ name: 'status', length: 20 })
  status: string;

  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string;

  @CreateDateColumn({ name: 'executed_at' })
  executedAt: Date;
}
