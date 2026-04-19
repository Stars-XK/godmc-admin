import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ListJobLogDto } from './dto/create-job.dto';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';

@Injectable()
export class JobLogService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async list(query: ListJobLogDto) {
    return firstValueFrom(this.client.send('monitor.jobLog.list', query));
  }

  async clean() {
    return firstValueFrom(this.client.send('monitor.jobLog.clean', {}));
  }

  async addJobLog(jobLog: any) {
    return firstValueFrom(this.client.send('monitor.jobLog.addJobLog', jobLog));
  }

  async export(res: Response, body: ListJobLogDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.list(body);
    const options = {
      sheetName: '调度日志',
      data: list.data.list,
      header: [
        { title: '日志序号', dataIndex: 'jobLogId' },
        { title: '任务名称', dataIndex: 'jobName' },
        { title: '任务组名', dataIndex: 'jobGroup' },
        { title: '调用目标字符串', dataIndex: 'invokeTarget' },
        { title: '日志信息', dataIndex: 'jobMessage' },
        { title: '执行状态', dataIndex: 'status' },
        { title: '异常信息', dataIndex: 'exceptionInfo' },
      ],
      dictMap: {
        status: {
          '0': '正常',
          '1': '失败',
        },
      },
    };
    ExportTable(options, res);
  }
}
