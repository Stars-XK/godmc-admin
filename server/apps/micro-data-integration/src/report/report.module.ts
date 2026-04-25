import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TdengineModule } from '../tdengine/tdengine.module';
import { WaterZoneEntity } from '@app/common/entities/water-basic/water-zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaterZoneEntity]),
    TdengineModule,
  ],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
