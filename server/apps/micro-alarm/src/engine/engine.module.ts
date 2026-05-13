import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineService } from './engine.service';
import { EngineController } from './engine.controller';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { RedisModule } from '@app/shared';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity]),
    RedisModule,
    NotifyModule,
  ],
  controllers: [EngineController],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
