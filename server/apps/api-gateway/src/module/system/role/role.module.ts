import { Global, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { SysRoleEntity } from '@app/common';
import { SysRoleWithMenuEntity } from '@app/common';
import { SysRoleWithDeptEntity } from '@app/common';
import { SysDeptEntity } from '@app/common';

@Global()
@Module({
  imports: [],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
