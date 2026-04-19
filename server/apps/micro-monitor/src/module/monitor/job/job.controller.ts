import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobService } from './job.service';

@Controller()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @MessagePattern('monitor.job.list')
  list(@Payload() query: any) {
    return this.jobService.list(query);
  }

  @MessagePattern('monitor.job.getJob')
  getJob(@Payload() jobId: number) {
    return this.jobService.getJob(jobId);
  }

  @MessagePattern('monitor.job.create')
  create(@Payload() payload: any) {
    return this.jobService.create(payload.createJobDto, payload.userName);
  }

  @MessagePattern('monitor.job.changeStatus')
  changeStatus(@Payload() payload: any) {
    return this.jobService.changeStatus(payload.jobId, payload.status, payload.userName);
  }

  @MessagePattern('monitor.job.update')
  update(@Payload() payload: any) {
    return this.jobService.update(payload.jobId, payload.updateJobDto, payload.userName);
  }

  @MessagePattern('monitor.job.remove')
  remove(@Payload() jobIds: number[]) {
    return this.jobService.remove(jobIds);
  }

  @MessagePattern('monitor.job.run')
  run(@Payload() jobId: number) {
    return this.jobService.run(jobId);
  }
}
