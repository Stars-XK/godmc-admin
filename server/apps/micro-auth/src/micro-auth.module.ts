import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { configuration } from '@app/shared';
import { SharedModule } from '@app/shared';

import { MicroAuthController } from './micro-auth.controller';
import { MicroAuthService } from './micro-auth.service';

import {
  UserEntity,
  SysDeptEntity,
  SysRoleEntity,
  SysPostEntity,
  SysUserWithRoleEntity,
  SysUserWithPostEntity,
  SysRoleWithMenuEntity,
  SysMenuEntity,
  SysConfigEntity,
  MonitorLoginlogEntity,
} from '@app/common';

@Module({
  imports: [
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
          entities: [
            UserEntity,
            SysDeptEntity,
            SysRoleEntity,
            SysPostEntity,
            SysUserWithRoleEntity,
            SysUserWithPostEntity,
            SysRoleWithMenuEntity,
            SysMenuEntity,
            SysConfigEntity,
            MonitorLoginlogEntity,
          ],
          autoLoadEntities: true,
          keepConnectionAlive: true,
          timezone: '+08:00',
          ...config.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      SysDeptEntity,
      SysRoleEntity,
      SysPostEntity,
      SysUserWithRoleEntity,
      SysUserWithPostEntity,
      SysRoleWithMenuEntity,
      SysMenuEntity,
      SysConfigEntity,
      MonitorLoginlogEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secretkey'),
      }),
      inject: [ConfigService],
    }),
    SharedModule,
  ],
  controllers: [MicroAuthController],
  providers: [MicroAuthService],
})
export class MicroAuthModule {}
