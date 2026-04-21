import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sys_db_updates' })
export class SysDbUpdateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 20 })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMsg: string;

  @Column({ type: 'datetime', nullable: true })
  executedAt: Date;
}
