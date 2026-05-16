import { EquipmentModule } from "./module/equipment/equipment.module";
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configuration } from '@app/shared';
import { SharedModule } from '@app/shared';
import { ZoneModule } from './module/zone/zone.module';
import { RevenueUserModule } from './module/revenue/revenue-user.module';
import { GisModule } from './module/gis/gis.module';
import { BillModule } from './module/billing/bill.module';
import { WaterQualityModule } from './module/water-quality/water-quality.module';
import { PressureModule } from './module/pressure/pressure.module';
import { PumpStationModule } from './module/pump-station/pump-station.module';
import { FlowMonitorModule } from './module/flow-monitor/flow-monitor.module';
import { EnergyModule } from './module/energy/energy.module';
import { BurstModule } from './module/burst/burst.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { JwtStrategy } from '@app/common/guards/jwt.strategy';
import { PermissionGuard } from '@app/common/guards/permission.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { RegistryModule, WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { MicroWaterBasicController } from './micro-water-basic.controller';
import { MicroWaterBasicService } from './micro-water-basic.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          entities: [`${__dirname}/**/*.entity{.ts,.js}`],
          autoLoadEntities: true,
          keepConnectionAlive: true,
          timezone: '+08:00',
          ...config.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get('jwt.secretkey'),
          signOptions: { expiresIn: config.get('jwt.expiresin') },
        };
      },
    }),
    SharedModule,
    ZoneModule, EquipmentModule, RevenueUserModule, GisModule, BillModule, WaterQualityModule, PressureModule, PumpStationModule, FlowMonitorModule, EnergyModule, BurstModule,
    RegistryModule,
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity]),
  ],
  controllers: [MicroWaterBasicController],
  providers: [
    MicroWaterBasicService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class MicroWaterBasicModule {}
