import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterZoneEntity } from '@app/common';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterZoneEntity])],
  controllers: [ZoneController],
  providers: [ZoneService],
})
export class ZoneModule {}
