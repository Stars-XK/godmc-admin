import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { TdengineModule } from '../tdengine/tdengine.module';
import { SysConfigEntity } from '@app/common/entities/config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysConfigEntity]),
    TdengineModule
  ],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
