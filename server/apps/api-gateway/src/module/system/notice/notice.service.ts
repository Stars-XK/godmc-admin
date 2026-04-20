import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysNoticeEntity } from '@app/common';
import { CreateNoticeDto, UpdateNoticeDto, ListNoticeDto } from './dto/index';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class NoticeService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  async create(createNoticeDto: CreateNoticeDto) {
      return firstValueFrom(this.client.send('system.notice.create', createNoticeDto));
  }

  async findAll(query: ListNoticeDto) {
      return firstValueFrom(this.client.send('system.notice.findAll', query));
  }

  async findOne(noticeId: number) {
      return firstValueFrom(this.client.send('system.notice.findOne', noticeId));
  }

  async update(updateNoticeDto: UpdateNoticeDto) {
      return firstValueFrom(this.client.send('system.notice.update', updateNoticeDto));
  }

  async remove(noticeIds: number[]) {
      return firstValueFrom(this.client.send('system.notice.remove', noticeIds));
  }
}
