import { Module } from '@nestjs/common';
import { ToolController } from './tool.controller';

@Module({
  imports: [],
  controllers: [ToolController],
  providers: [],
})
export class ToolModule {}
