import { Module } from '@nestjs/common';
import { ZoneModule } from './zone/zone.module';

@Module({
  imports: [ZoneModule],
})
export class WaterBasicModule {}
