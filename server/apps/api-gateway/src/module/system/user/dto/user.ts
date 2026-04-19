import { SysDeptEntity } from '@app/common';
import { SysPostEntity } from '@app/common';
import { SysRoleEntity } from '@app/common';
import { UserEntity } from '@app/common';

export type UserType = {
  browser: string;
  ipaddr: string;
  loginLocation: string;
  loginTime: Date;
  os: string;
  permissions: string[];
  roles: string[];
  token: string;
  user: {
    dept: SysDeptEntity;
    roles: Array<SysRoleEntity>;
    posts: Array<SysPostEntity>;
  } & UserEntity;
  userId: number;
  userName: string;
  deptId: number;
};
