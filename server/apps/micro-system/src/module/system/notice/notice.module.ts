import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { SysNoticeEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([SysNoticeEntity])],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
