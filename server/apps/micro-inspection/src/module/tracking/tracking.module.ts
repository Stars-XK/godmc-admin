import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { InspectionGateway } from '../../gateway/inspection.gateway';
import { InspectionLocationTrackEntity, InspectionTaskEntity, InspectionRouteEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionLocationTrackEntity, InspectionTaskEntity, InspectionRouteEntity])],
  controllers: [TrackingController],
  providers: [TrackingService, InspectionGateway],
  exports: [TrackingService, InspectionGateway],
})
export class TrackingModule {}
