import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysConfigEntity } from '@app/common';
import { NotifyService } from './notify.service';

@Module({
  imports: [TypeOrmModule.forFeature([SysConfigEntity])],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
