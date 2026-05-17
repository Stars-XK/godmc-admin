import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { InspectionPlanEntity, InspectionRouteEntity } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionPlanEntity, InspectionRouteEntity]),
  ],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
