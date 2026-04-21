import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { TdengineModule } from '../tdengine/tdengine.module';

@Module({
  imports: [TdengineModule],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
