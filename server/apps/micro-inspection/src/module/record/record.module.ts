import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { InspectionRecordEntity, InspectionTaskEntity, InspectionCheckpointEntity } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionRecordEntity, InspectionTaskEntity, InspectionCheckpointEntity]),
  ],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService],
})
export class RecordModule {}
