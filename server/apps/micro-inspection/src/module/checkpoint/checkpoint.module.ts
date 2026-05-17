import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckpointController } from './checkpoint.controller';
import { CheckpointService } from './checkpoint.service';
import { InspectionCheckpointEntity, InspectionCheckItemEntity } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionCheckpointEntity, InspectionCheckItemEntity]),
  ],
  controllers: [CheckpointController],
  providers: [CheckpointService],
  exports: [CheckpointService],
})
export class CheckpointModule {}
