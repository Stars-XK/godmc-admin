import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { SysDictDataEntity, WaterBillEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([SysDictDataEntity, WaterBillEntity])],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
