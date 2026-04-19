import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { QueryOperLogDto } from './dto/operLog.dto';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';

@Injectable()
export class OperlogService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async findAll(query: QueryOperLogDto) {
    return firstValueFrom(this.client.send('monitor.operlog.findAll', query));
  }

  async findOne(id: number) {
    return firstValueFrom(this.client.send('monitor.operlog.findOne', id));
  }

  async removeAll() {
    return firstValueFrom(this.client.send('monitor.operlog.removeAll', {}));
  }

  async remove(operId: number) {
    return firstValueFrom(this.client.send('monitor.operlog.remove', operId));
  }

  async logAction(payload: any) {
    return firstValueFrom(this.client.send('monitor.operlog.logAction', payload));
  }

  async export(res: Response, body: QueryOperLogDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '操作日志',
      data: list.data.list,
      header: [
        { title: '日志主键', dataIndex: 'operId' },
        { title: '模块标题', dataIndex: 'title' },
        { title: '业务类型', dataIndex: 'businessType' },
        { title: '方法名称', dataIndex: 'method' },
        { title: '请求方式', dataIndex: 'requestMethod' },
        { title: '操作人员', dataIndex: 'operName' },
        { title: '部门名称', dataIndex: 'deptName' },
        { title: '请求URL', dataIndex: 'operUrl' },
        { title: '主机地址', dataIndex: 'operIp' },
        { title: '操作地点', dataIndex: 'operLocation' },
        { title: '请求参数', dataIndex: 'operParam' },
        { title: '返回参数', dataIndex: 'jsonResult' },
        { title: '操作状态', dataIndex: 'status' },
        { title: '错误消息', dataIndex: 'errorMsg' },
        { title: '操作时间', dataIndex: 'operTime' },
        { title: '消耗时间', dataIndex: 'costTime' },
      ],
      dictMap: {
        status: {
          '0': '正常',
          '1': '异常',
        },
        businessType: {
          '0': '其它',
          '1': '新增',
          '2': '修改',
          '3': '删除',
          '4': '授权',
          '5': '导出',
          '6': '导入',
          '7': '强退',
          '8': '生成代码',
          '9': '清空数据',
        },
      },
    };
    ExportTable(options, res);
  }
}
