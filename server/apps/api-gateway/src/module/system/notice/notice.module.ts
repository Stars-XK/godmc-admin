import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { SysNoticeEntity } from '@app/common';

@Module({
  imports: [],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
