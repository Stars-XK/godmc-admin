import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictService } from './dict.service';
import { DictController } from './dict.controller';
import { SysDictTypeEntity } from '@app/common';
import { SysDictDataEntity } from '@app/common';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SysDictTypeEntity, SysDictDataEntity])],
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}
