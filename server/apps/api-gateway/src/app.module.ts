import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configuration } from '@app/shared';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { PermissionGuard } from '@app/common/guards/permission.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';

import { SharedModule } from '@app/shared';
import { MicroservicesModule } from './microservices.module';
import { RegistryModule } from '@app/common';
import { ScheduleModule } from '@nestjs/schedule';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    MicroservicesModule,
    // 配置模块
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    // 数据库
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
    RegistryModule,
  ],
  providers: [
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
export class AppModule {}
