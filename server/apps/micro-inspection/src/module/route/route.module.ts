import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { InspectionRouteEntity, InspectionCheckpointEntity, InspectionCheckItemEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionRouteEntity, InspectionCheckpointEntity, InspectionCheckItemEntity])],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService],
})
export class RouteModule {}
