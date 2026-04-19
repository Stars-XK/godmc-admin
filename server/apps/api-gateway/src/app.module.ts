import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from '@app/shared';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guards/auth.guard';
import { PermissionGuard } from '@app/common/guards/permission.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';

import { MainModule } from './module/main/main.module';
import { UploadModule } from './module/upload/upload.module';
import { SystemModule } from './module/system/system.module';
import { SharedModule } from '@app/shared';
import { MonitorModule } from './module/monitor/monitor.module';
import { MicroservicesModule } from './microservices.module';

@Global()
@Module({
  imports: [
    MicroservicesModule,
    // 配置模块
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),MainModule,
    UploadModule,

    SharedModule,
    SystemModule,
    MonitorModule,
  ],
  providers: [
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
export class AppModule {}
