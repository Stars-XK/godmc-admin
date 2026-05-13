import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueIngestionService } from './revenue-ingestion.service';
import { RevenueIngestionController } from './revenue-ingestion.controller';
import { TdengineModule } from '../tdengine/tdengine.module';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';
import { DataIntegrationSourceEntity } from '@app/common/entities/data-integration/data-source.entity';
import { SysConfigEntity } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaterRevenueUserEntity, DataIntegrationSourceEntity, SysConfigEntity]),
    TdengineModule,
  ],
  providers: [RevenueIngestionService],
  controllers: [RevenueIngestionController],
  exports: [RevenueIngestionService],
})
export class IngestionModule {}
