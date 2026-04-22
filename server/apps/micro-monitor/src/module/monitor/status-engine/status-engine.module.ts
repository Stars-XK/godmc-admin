import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { StatusEngineService } from './status-engine.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity]),
    ClientsModule.register([
      {
        name: 'MICRO_WATER_BASIC',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_WATER_BASIC_HOST || '127.0.0.1', port: 3006 },
      },
    ]),
  ],
  providers: [StatusEngineService],
})
export class StatusEngineModule {}