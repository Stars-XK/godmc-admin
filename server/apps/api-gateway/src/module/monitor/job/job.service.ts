import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateJobDto, ListJobDto } from './dto/create-job.dto';
import { Job } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';

@Injectable()
export class JobService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async list(query: any) {
    return firstValueFrom(this.client.send('monitor.job.list', query));
  }

  async getJob(jobId: number) {
    return firstValueFrom(this.client.send('monitor.job.getJob', jobId));
  }

  async create(createJobDto: CreateJobDto, userName: string) {
    return firstValueFrom(this.client.send('monitor.job.create', { createJobDto, userName }));
  }

  async update(jobId: number, updateJobDto: Partial<Job>, userName: string) {
    return firstValueFrom(this.client.send('monitor.job.update', { jobId, updateJobDto, userName }));
  }

  async remove(jobIds: number | number[]) {
    return firstValueFrom(this.client.send('monitor.job.remove', jobIds));
  }

  async changeStatus(jobId: number, status: string, userName: string) {
    return firstValueFrom(this.client.send('monitor.job.changeStatus', { jobId, status, userName }));
  }

  async run(jobId: number) {
    return firstValueFrom(this.client.send('monitor.job.run', jobId));
  }

  async export(res: Response, body: ListJobDto) {
    const list = await this.list(body);
    const options = {
      sheetName: '定时任务',
      data: list.data.list,
      header: [
        { title: '任务序号', dataIndex: 'jobId' },
        { title: '任务名称', dataIndex: 'jobName' },
        { title: '任务组名', dataIndex: 'jobGroup' },
        { title: '调用目标字符串', dataIndex: 'invokeTarget' },
        { title: '执行表达式', dataIndex: 'cronExpression' },
        { title: '状态', dataIndex: 'status' },
      ],
      dictMap: {
        status: {
          '0': '正常',
          '1': '暂停',
        },
      },
    };
    ExportTable(options, res);
  }
}
