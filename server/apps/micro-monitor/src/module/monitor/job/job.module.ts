import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobLogService } from './job-log.service';
import { JobLogController } from './job-log.controller';

@Module({
  imports: [],
  controllers: [JobController, JobLogController],
  providers: [JobService, JobLogService],
  exports: [JobService],
})
export class JobModule {}
