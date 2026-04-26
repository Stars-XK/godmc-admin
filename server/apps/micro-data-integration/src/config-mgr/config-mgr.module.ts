import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity } from '@app/common';
import { ConfigMgrService } from './config-mgr.service';
import { ConfigMgrController } from './config-mgr.controller';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity]),
    EngineModule,
  ],
  controllers: [ConfigMgrController],
  providers: [ConfigMgrService],
})
export class ConfigMgrModule {}