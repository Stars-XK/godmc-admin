import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobLogService } from './job-log.service';

@Controller()
export class JobLogController {
  constructor(private readonly jobLogService: JobLogService) {}

  @MessagePattern('monitor.jobLog.list')
  list(@Payload() query: any) {
    return this.jobLogService.list(query);
  }

  @MessagePattern('monitor.jobLog.clean')
  clean() {
    return this.jobLogService.clean();
  }

  @MessagePattern('monitor.jobLog.addJobLog')
  addJobLog(@Payload() jobLog: any) {
    return this.jobLogService.addJobLog(jobLog);
  }
}
