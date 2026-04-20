import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysDbUpdateEntity } from './db-update.entity';
import { DbUpdaterService } from './db-updater.service';

@Module({
  imports: [TypeOrmModule.forFeature([SysDbUpdateEntity])],
  providers: [DbUpdaterService],
  exports: [DbUpdaterService]
})
export class DbUpdaterModule {}
