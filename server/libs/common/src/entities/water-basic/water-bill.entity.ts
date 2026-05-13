import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('water_bill', {
  comment: '【水务基础】水费账单表',
})
export class WaterBillEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '账单ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'bill_id', comment: '账单ID' })
  public billId: number;

  @ApiProperty({ type: String, description: '用户编号' })
  @Column({ type: 'varchar', name: 'user_no', length: 50, comment: '用户编号' })
  public userNo: string;

  @ApiProperty({ type: String, description: '所属分区编码' })
  @Column({ type: 'varchar', name: 'zone_code', length: 50, comment: '分区编码', nullable: true })
  public zoneCode: string;

  @ApiProperty({ type: String, description: '账单周期(YYYY-MM)' })
  @Column({ type: 'varchar', name: 'bill_period', length: 7, comment: '账单周期' })
  public billPeriod: string;

  @ApiProperty({ type: Number, description: '用水量(m³)' })
  @Column({ type: 'decimal', name: 'water_usage', precision: 12, scale: 3, default: 0, comment: '用水量(m³)' })
  public waterUsage: number;

  @ApiProperty({ type: Number, description: '单价(元/m³)' })
  @Column({ type: 'decimal', name: 'unit_price', precision: 10, scale: 4, default: 0, comment: '单价(元/m³)' })
  public unitPrice: number;

  @ApiProperty({ type: Number, description: '账单总金额(元)' })
  @Column({ type: 'decimal', name: 'total_amount', precision: 12, scale: 2, default: 0, comment: '账单总金额(元)' })
  public totalAmount: number;

  @ApiProperty({ type: Number, description: '已缴金额(元)' })
  @Column({ type: 'decimal', name: 'paid_amount', precision: 12, scale: 2, default: 0, comment: '已缴金额(元)' })
  public paidAmount: number;

  @ApiProperty({ type: Number, description: '未缴金额(元)' })
  @Column({ type: 'decimal', name: 'unpaid_amount', precision: 12, scale: 2, default: 0, comment: '未缴金额(元)' })
  public unpaidAmount: number;

  @ApiProperty({ type: String, description: '账单状态（0未缴 1部分缴纳 2已缴清）' })
  @Column({ type: 'char', name: 'bill_status', length: 1, default: '0', comment: '账单状态（0未缴 1部分 2已缴）' })
  public billStatus: string;

  @ApiProperty({ type: Date, description: '账单生成时间' })
  @Column({ type: 'datetime', name: 'generate_time', comment: '账单生成时间', nullable: true })
  public generateTime: Date;

  @ApiProperty({ type: Date, description: '最后缴费时间' })
  @Column({ type: 'datetime', name: 'pay_time', comment: '最后缴费时间', nullable: true })
  public payTime: Date;

  @ApiProperty({ type: String, description: '删除标志（0代表存在 2代表删除）' })
  @Column({ type: 'char', name: 'del_flag', length: 1, default: '0', comment: '删除标志' })
  public delFlag: string;

  @ApiProperty({ type: Number, description: '部门ID' })
  @Column({ type: 'bigint', name: 'dept_id', comment: '部门ID', nullable: true })
  public deptId: number;
}
