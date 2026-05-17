import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { configuration, SharedModule } from '@app/shared';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { JwtStrategy } from '@app/common/guards/jwt.strategy';
import { PermissionGuard } from '@app/common/guards/permission.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { RegistryModule } from '@app/common';
import { MicroInspectionController } from './micro-inspection.controller';
import { MicroInspectionService } from './micro-inspection.service';
import { PlanModule } from './module/plan/plan.module';
import { TaskModule } from './module/task/task.module';
import { RouteModule } from './module/route/route.module';
import { CheckpointModule } from './module/checkpoint/checkpoint.module';
import { RecordModule } from './module/record/record.module';
import { IssueModule } from './module/issue/issue.module';
import { ReviewModule } from './module/review/review.module';
import { TrackingModule } from './module/tracking/tracking.module';
import { StatisticsModule } from './module/statistics/statistics.module';
import { PhotoModule } from './module/photo/photo.module';
import { MobileModule } from './module/mobile/mobile.module';
import {
  InspectionPlanEntity,
  InspectionTaskEntity,
  InspectionRouteEntity,
  InspectionCheckpointEntity,
  InspectionCheckItemEntity,
  InspectionRecordEntity,
  InspectionIssueEntity,
  InspectionPhotoEntity,
  InspectionLocationTrackEntity,
  InspectionReviewEntity,
  InspectionStatisticsEntity,
} from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          entities: [`${__dirname}/**/*.entity{.ts,.js}`],
          autoLoadEntities: true,
          keepConnectionAlive: true,
          timezone: '+08:00',
          ...config.get('db.mysql'),
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature([
      InspectionPlanEntity,
      InspectionTaskEntity,
      InspectionRouteEntity,
      InspectionCheckpointEntity,
      InspectionCheckItemEntity,
      InspectionRecordEntity,
      InspectionIssueEntity,
      InspectionPhotoEntity,
      InspectionLocationTrackEntity,
      InspectionReviewEntity,
      InspectionStatisticsEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get('jwt.secretkey'),
          signOptions: { expiresIn: config.get('jwt.expiresin') },
        };
      },
    }),
    SharedModule,
    RegistryModule,
    PlanModule,
    TaskModule,
    RouteModule,
    CheckpointModule,
    RecordModule,
    IssueModule,
    ReviewModule,
    TrackingModule,
    StatisticsModule,
    PhotoModule,
    MobileModule,
  ],
  controllers: [MicroInspectionController],
  providers: [
    MicroInspectionService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class MicroInspectionModule {}
