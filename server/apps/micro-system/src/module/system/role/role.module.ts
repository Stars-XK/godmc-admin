import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { SysRoleEntity } from '@app/common';
import { SysRoleWithMenuEntity } from '@app/common';
import { SysRoleWithDeptEntity } from '@app/common';
import { SysDeptEntity } from '@app/common';
import { MenuModule } from '../menu/menu.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SysRoleEntity, SysRoleWithMenuEntity, SysRoleWithDeptEntity, SysDeptEntity]), forwardRef(() => MenuModule)],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
