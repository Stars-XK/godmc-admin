import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';

@Entity({ name: 'scada_revenue_user' })
export class WaterRevenueUserEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '【水务基础】营收基础用户信息表' })
  id: string;

  @Index('uk_user_no', { unique: true })
  @Column({ type: 'varchar', length: 50, name: 'user_no', comment: '用户编号' })
  userNo: string;

  @Column({ type: 'varchar', length: 100, name: 'user_name', nullable: true, comment: '用户名称' })
  userName: string;

  @Column({ type: 'varchar', length: 50, name: 'user_type', nullable: true, comment: '用户类型' })
  userType: string;

  @Column({ type: 'varchar', length: 50, name: 'phone', nullable: true, comment: '手机号' })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'address', nullable: true, comment: '地址' })
  address: string;

  @Column({ type: 'varchar', length: 50, name: 'meter_no', nullable: true, comment: '水表编号' })
  meterNo: string;

  @Column({ type: 'varchar', length: 50, name: 'book_no', nullable: true, comment: '表册编号' })
  bookNo: string;

  @Column({ type: 'varchar', length: 50, name: 'charge_type', nullable: true, comment: '收费类型' })
  chargeType: string;

  @Column({ type: 'varchar', length: 20, name: 'caliber', nullable: true, comment: '口径' })
  caliber: string;

  @Column({ type: 'varchar', length: 50, name: 'card_category', nullable: true, comment: '用户水卡分类' })
  cardCategory: string;

  @Column({ type: 'varchar', length: 50, name: 'user_category', nullable: true, comment: '用户分类' })
  userCategory: string;

  @Column({ type: 'char', length: 1, name: 'status', default: '0', comment: '用户状态(0正常 1停用)' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'arrears_amount', default: 0.00, comment: '欠费金额' })
  arrearsAmount: number;

  @Column({ type: 'bigint', name: 'associated_user_id', nullable: true, comment: '关联系统用户ID' })
  associatedUserId: string;

  @Column({ type: 'varchar', length: 500, name: 'remark', nullable: true, comment: '备注' })
  remark: string;

  @Column({ type: 'char', length: 1, name: 'del_flag', default: '0', comment: '删除标志(0代表存在 2代表删除)' })
  delFlag: string;
}