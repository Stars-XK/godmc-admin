import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import {
  InspectionStatisticsEntity,
  InspectionTaskEntity,
  InspectionRecordEntity,
  InspectionIssueEntity,
} from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([
    InspectionStatisticsEntity,
    InspectionTaskEntity,
    InspectionRecordEntity,
    InspectionIssueEntity,
  ])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
