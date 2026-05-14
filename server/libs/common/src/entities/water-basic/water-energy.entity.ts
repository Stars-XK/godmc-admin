import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../base';
import { dateTransformer } from '../../utils/index';

@Entity('water_energy_record', { comment: '能耗记录表' })
export class WaterEnergyEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '记录ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'record_id', comment: '记录ID' })
  public recordId: number;

  @ApiProperty({ type: String, description: '站点编码' })
  @Column({ type: 'varchar', name: 'station_code', length: 50, comment: '站点编码' })
  public stationCode: string;

  @ApiProperty({ type: String, description: '站点名称' })
  @Column({ type: 'varchar', name: 'station_name', length: 100, default: '', comment: '站点名称' })
  public stationName: string;

  @ApiProperty({ type: String, description: '记录周期(YYYY-MM-DD或YYYY-MM)' })
  @Column({ type: 'varchar', name: 'record_period', length: 20, comment: '记录周期' })
  public recordPeriod: string;

  @ApiProperty({ type: String, description: '周期类型(1d/1mo)' })
  @Column({ type: 'varchar', name: 'period_type', length: 10, default: '1d', comment: '周期类型' })
  public periodType: string;

  @ApiProperty({ type: Number, description: '耗电量(kWh)' })
  @Column({ type: 'decimal', name: 'power_consumption', precision: 12, scale: 2, default: 0, comment: '耗电量(kWh)' })
  public powerConsumption: number;

  @ApiProperty({ type: Number, description: '供水量(m³)' })
  @Column({ type: 'decimal', name: 'water_output', precision: 12, scale: 2, default: 0, comment: '供水量(m³)' })
  public waterOutput: number;

  @ApiProperty({ type: Number, description: '单位能耗(kWh/m³)' })
  @Column({ type: 'decimal', name: 'unit_consumption', precision: 8, scale: 4, default: 0, comment: '单位能耗(kWh/m³)' })
  public unitConsumption: number;

  @ApiProperty({ type: Number, description: '峰段电量(kWh)' })
  @Column({ type: 'decimal', name: 'peak_power', precision: 12, scale: 2, default: 0, comment: '峰段电量' })
  public peakPower: number;

  @ApiProperty({ type: Number, description: '谷段电量(kWh)' })
  @Column({ type: 'decimal', name: 'valley_power', precision: 12, scale: 2, default: 0, comment: '谷段电量' })
  public valleyPower: number;

  @ApiProperty({ type: Date, description: '记录时间' })
  @Column({ type: 'datetime', name: 'record_time', default: null, transformer: dateTransformer, comment: '记录时间' })
  public recordTime: Date;
}
