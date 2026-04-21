import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TdengineService } from './tdengine.service';

@Module({
  imports: [HttpModule],
  providers: [TdengineService],
  exports: [TdengineService],
})
export class TdengineModule {}