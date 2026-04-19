import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NoticeService } from './notice.service';

@Controller()
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @MessagePattern('system.notice.create')
  create(@Payload() createNoticeDto: any) {
    return this.noticeService.create(createNoticeDto);
  }

  @MessagePattern('system.notice.findAll')
  findAll(@Payload() query: any) {
    return this.noticeService.findAll(query);
  }

  @MessagePattern('system.notice.findOne')
  findOne(@Payload() noticeId: any) {
    return this.noticeService.findOne(noticeId);
  }

  @MessagePattern('system.notice.update')
  update(@Payload() updateNoticeDto: any) {
    return this.noticeService.update(updateNoticeDto);
  }

  @MessagePattern('system.notice.remove')
  remove(@Payload() noticeIds: any) {
    return this.noticeService.remove(noticeIds);
  }

}
