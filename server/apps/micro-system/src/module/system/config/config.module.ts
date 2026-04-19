import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { SysConfigController } from './config.controller';
import { SysConfigEntity } from '@app/common';
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SysConfigEntity])],
  controllers: [SysConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class SysConfigModule {}
