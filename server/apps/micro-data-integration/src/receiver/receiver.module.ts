import { Module } from '@nestjs/common';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataIntegrationMappingEntity } from '@app/common';
import { TdengineModule } from '../tdengine/tdengine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataIntegrationMappingEntity]),
    TdengineModule,
  ],
  controllers: [ReceiverController],
  providers: [ReceiverService],
})
export class ReceiverModule {}