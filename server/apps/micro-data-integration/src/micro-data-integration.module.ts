import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configuration } from '@app/shared';
import { SharedModule } from '@app/shared';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { JwtStrategy } from '@app/common/guards/jwt.strategy';
import { PermissionGuard } from '@app/common/guards/permission.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { RegistryModule } from '@app/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TdengineModule } from './tdengine/tdengine.module';
import { ReceiverModule } from './receiver/receiver.module';
import { EngineModule } from './engine/engine.module';
import { ConfigMgrModule } from './config-mgr/config-mgr.module';
import { QueryModule } from './query/query.module';
import { 
  DataIntegrationSourceEntity, 
  DataIntegrationTaskEntity, 
  DataIntegrationMappingEntity 
} from '@app/common';
import { WaterPointEntity } from '@app/common';
import { TdengineAggModule } from './tdengine/tdengine-agg.module';

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
          entities: [`${__dirname}/**/*.entity{.ts,.js}`, DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity, WaterPointEntity],
          autoLoadEntities: true,
          keepConnectionAlive: true,
          timezone: '+08:00',
          ...config.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature([DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity, WaterPointEntity]),
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
    ScheduleModule.forRoot(),
    SharedModule,
    RegistryModule,
    TdengineModule,
    TdengineAggModule,
    ReceiverModule,
    EngineModule,
    ConfigMgrModule,
    QueryModule,
  ],
  providers: [
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
export class MicroDataIntegrationModule {}
