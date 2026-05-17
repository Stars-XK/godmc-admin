import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RegistryService } from './registry.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}