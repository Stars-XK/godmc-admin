import { Module, Global } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { SysMenuEntity } from '@app/common';
import { SysRoleWithMenuEntity } from '@app/common';

@Global()
@Module({
  imports: [],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
