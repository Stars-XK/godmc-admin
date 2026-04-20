import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { AuthModule } from '../system/auth/auth.module';
import { DictModule } from '../system/dict/dict.module';
import { SysConfigModule } from '../system/config/config.module';
import { UserModule } from '../system/user/user.module';

@Module({
  imports: [AuthModule, DictModule, SysConfigModule, UserModule],
  controllers: [MainController],
})
export class MainModule {}
