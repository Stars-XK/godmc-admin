import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { FlowMonitorController } from './flow-monitor.controller';
import { FlowMonitorService } from './flow-monitor.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity])],
  controllers: [FlowMonitorController],
  providers: [FlowMonitorService],
  exports: [FlowMonitorService],
})
export class FlowMonitorModule {}
