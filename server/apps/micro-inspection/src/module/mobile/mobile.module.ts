import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { TaskModule } from '../task/task.module';
import { RecordModule } from '../record/record.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [TaskModule, RecordModule, TrackingModule],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}
