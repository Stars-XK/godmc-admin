import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configuration } from '@app/shared';
import { SharedModule } from '@app/shared';
import { SystemModule } from './module/system/system.module';
import { MainModule } from './module/main/main.module';
import { RegistryModule } from '@app/common';
import { MicroservicesModule } from '@app/api-gateway/microservices.module';

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
    SharedModule,
    MicroservicesModule,
    SystemModule,
    MainModule,
    RegistryModule,
  ],
})
export class MicroSystemModule {}
