import { Module, Global } from '@nestjs/common';
import { OperlogService } from './operlog.service';
import { OperlogController } from './operlog.controller';
import { SysOperlogEntity } from '@app/common';

@Global()
@Module({
  imports: [],
  controllers: [OperlogController],
  providers: [
    OperlogService,
    {
      provide: 'OPERLOG_SERVICE',
      useExisting: OperlogService,
    },
  ],
  exports: [OperlogService, 'OPERLOG_SERVICE'],
})
export class OperlogModule {}
