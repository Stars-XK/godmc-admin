import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { InspectionIssueEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionIssueEntity])],
  controllers: [IssueController],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
