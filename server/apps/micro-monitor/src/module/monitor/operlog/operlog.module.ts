import { Module, Global } from '@nestjs/common';
import { OperlogService } from './operlog.service';
import { OperlogController } from './operlog.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysOperlogEntity } from '@app/common';
import { DictClientService } from './dict-client.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SysOperlogEntity])],
  controllers: [OperlogController],
  providers: [
    OperlogService,
    DictClientService,
    {
      provide: 'OPERLOG_SERVICE',
      useExisting: OperlogService,
    },
  ],
  exports: [OperlogService, 'OPERLOG_SERVICE'],
})
export class OperlogModule {}
