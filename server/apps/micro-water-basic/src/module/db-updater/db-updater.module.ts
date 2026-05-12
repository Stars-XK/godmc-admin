import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbUpdaterService } from './db-updater.service';
import { SysDbUpdateEntity } from './db-update.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysDbUpdateEntity])],
  providers: [DbUpdaterService],
  exports: [DbUpdaterService],
})
export class DbUpdaterModule {}
