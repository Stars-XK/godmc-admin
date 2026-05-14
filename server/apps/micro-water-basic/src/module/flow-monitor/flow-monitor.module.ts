import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity } from '@app/common';
import { FlowMonitorController } from './flow-monitor.controller';
import { FlowMonitorService } from './flow-monitor.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterPointEntity])],
  controllers: [FlowMonitorController],
  providers: [FlowMonitorService],
  exports: [FlowMonitorService],
})
export class FlowMonitorModule {}
