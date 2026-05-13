import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { TdengineModule } from '../tdengine/tdengine.module';
import { SysConfigEntity } from '@app/common/entities/config.entity';
import { WaterPointEntity } from '@app/common/entities/water-basic/water-point.entity';
import { WaterDeviceEntity } from '@app/common/entities/water-basic/water-device.entity';
import { SysAlarmHistoryEntity } from '@app/common/entities/alarm/sys-alarm-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysConfigEntity, WaterPointEntity, WaterDeviceEntity, SysAlarmHistoryEntity]),
    TdengineModule
  ],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
