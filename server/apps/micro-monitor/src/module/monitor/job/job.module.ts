import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobLogService } from './job-log.service';
import { JobLogController } from './job-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobLog } from './entities/job-log.entity';
import { TaskService } from './task.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobLog])],
  controllers: [JobController, JobLogController],
  providers: [JobService, JobLogService, TaskService],
  exports: [JobService],
})
export class JobModule {}
