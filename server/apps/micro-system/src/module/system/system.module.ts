import { Module, Global } from '@nestjs/common';
import { DeptModule } from './dept/dept.module';
import { SysConfigModule } from './config/config.module';
import { DictModule } from './dict/dict.module';
import { MenuModule } from './menu/menu.module';
import { NoticeModule } from './notice/notice.module';
import { PostModule } from './post/post.module';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { DbUpdaterModule } from './db-updater/db-updater.module';

@Global()
@Module({
  imports: [
    SysConfigModule, // 系统配置
    DeptModule,
    DictModule,
    MenuModule,
    NoticeModule,
    PostModule,
    RoleModule,
    UserModule,
    DbUpdaterModule,
  ],
})
export class SystemModule {}
