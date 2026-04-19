import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { ExportTable } from '@app/common/utils/export';
import { SysPostEntity } from '@app/common';
import { Response } from 'express';
import { CreatePostDto, UpdatePostDto, ListPostDto } from './dto/index';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class PostService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  async create(createPostDto: CreatePostDto) {
      return firstValueFrom(this.client.send('system.post.create', createPostDto));
  }

  async findAll(query: ListPostDto) {
      return firstValueFrom(this.client.send('system.post.findAll', query));
  }

  async findOne(postId: number) {
      return firstValueFrom(this.client.send('system.post.findOne', postId));
  }

  async update(updatePostDto: UpdatePostDto) {
      return firstValueFrom(this.client.send('system.post.update', updatePostDto));
  }

  async remove(postIds: string[]) {
      return firstValueFrom(this.client.send('system.post.remove', postIds));
  }

  /**
   * 导出岗位管理数据为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListPostDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '岗位数据',
      data: list.data.list,
      header: [
        { title: '岗位序号', dataIndex: 'postId' },
        { title: '岗位编码', dataIndex: 'postCode' },
        { title: '岗位名称', dataIndex: 'postName' },
        { title: '岗位排序', dataIndex: 'postSort' },
        { title: '状态', dataIndex: 'status' },
      ],
    };
    ExportTable(options, res);
  }
}
