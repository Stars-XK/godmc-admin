import { Module } from '@nestjs/common';
import { MicroAlarmController } from './micro-alarm.controller';
import { MicroAlarmService } from './micro-alarm.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configuration, SharedModule } from '@app/shared';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { JwtStrategy } from '@app/common/guards/jwt.strategy';
import { PermissionGuard } from '@app/common/guards/permission.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { RegistryModule } from '@app/common';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { RuleModule } from './rule/rule.module';
import { EngineModule } from './engine/engine.module';
import { HistoryModule } from './history/history.module';
import { TmqModule } from './tmq/tmq.module';
import { TdengineModule } from './tdengine/tdengine.module';

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
          entities: [`${__dirname}/**/*.entity{.ts,.js}`, SysAlarmRuleEntity, SysAlarmHistoryEntity],
          autoLoadEntities: true,
          keepConnectionAlive: true,
          timezone: '+08:00',
          ...config.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity]),
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
    RegistryModule,
    RuleModule,
    EngineModule,
    HistoryModule,
    TmqModule,
    TdengineModule,
  ],
  controllers: [MicroAlarmController],
  providers: [
    MicroAlarmService,
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
export class MicroAlarmModule {}
