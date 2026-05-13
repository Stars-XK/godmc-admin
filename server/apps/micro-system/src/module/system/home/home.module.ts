import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import {
  WaterZoneEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      WaterZoneEntity,
      WaterDeviceEntity,
      WaterPointEntity,
      SysAlarmHistoryEntity,
    ]),
  ],
  controllers: [HomeController],
})
export class HomeModule {}
