import { Module, Global } from '@nestjs/common';
import { LoginlogService } from './loginlog.service';
import { LoginlogController } from './loginlog.controller';
import { MonitorLoginlogEntity } from '@app/common';
@Global()
@Module({
  imports: [],
  controllers: [LoginlogController],
  providers: [LoginlogService],
  exports: [LoginlogService],
})
export class LoginlogModule {}
