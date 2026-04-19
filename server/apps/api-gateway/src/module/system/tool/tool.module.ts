import { Module } from '@nestjs/common';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenTableEntity } from '@app/common';
import { GenTableColumnEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([GenTableEntity, GenTableColumnEntity])],
  controllers: [ToolController],
  providers: [ToolService],
})
export class ToolModule {}
