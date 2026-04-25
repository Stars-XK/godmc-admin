import { Module } from '@nestjs/common';
import { MicroAlarmController } from './micro-alarm.controller';
import { MicroAlarmService } from './micro-alarm.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [MicroAlarmController],
  providers: [MicroAlarmService],
})
export class MicroAlarmModule {}
