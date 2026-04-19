import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateLoginlogDto, ListLoginlogDto } from './dto/index';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';

@Injectable()
export class LoginlogService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async create(createLoginlogDto: CreateLoginlogDto) {
    return firstValueFrom(this.client.send('monitor.loginlog.create', createLoginlogDto));
  }

  async findAll(query: ListLoginlogDto) {
    return firstValueFrom(this.client.send('monitor.loginlog.findAll', query));
  }

  async remove(ids: string[]) {
    return firstValueFrom(this.client.send('monitor.loginlog.remove', ids));
  }

  async removeAll() {
    return firstValueFrom(this.client.send('monitor.loginlog.removeAll', {}));
  }

  async export(res: Response, body: ListLoginlogDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '登录日志',
      data: list.data.list,
      header: [
        { title: '序号', dataIndex: 'infoId' },
        { title: '用户账号', dataIndex: 'userName' },
        { title: '登录状态', dataIndex: 'status' },
        { title: '登录地址', dataIndex: 'ipaddr' },
        { title: '登录地点', dataIndex: 'loginLocation' },
        { title: '浏览器', dataIndex: 'browser' },
        { title: '操作系统', dataIndex: 'os' },
        { title: '提示消息', dataIndex: 'msg' },
        { title: '访问时间', dataIndex: 'loginTime' },
      ],
      dictMap: {
        status: {
          '0': '成功',
          '1': '失败',
        },
      },
    };
    ExportTable(options, res);
  }
}
