import { Module } from '@nestjs/common';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataIntegrationMappingEntity, DataIntegrationTaskEntity } from '@app/common';
import { TdengineModule } from '../tdengine/tdengine.module';
import { TdengineAggModule } from '../tdengine/tdengine-agg.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataIntegrationMappingEntity, DataIntegrationTaskEntity]),
    TdengineModule,
    TdengineAggModule,
  ],
  controllers: [ReceiverController],
  providers: [ReceiverService],
  exports: [ReceiverService],
})
export class ReceiverModule {}
