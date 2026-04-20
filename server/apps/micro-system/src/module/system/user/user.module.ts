import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from '@app/common';
import { SysUserWithPostEntity } from '@app/common';
import { SysUserWithRoleEntity } from '@app/common';
import { SysDeptEntity } from '@app/common';
import { SysRoleEntity } from '@app/common';
import { SysPostEntity } from '@app/common';
import { RoleModule } from '../role/role.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SysDeptEntity, SysRoleEntity, SysPostEntity, SysUserWithPostEntity, SysUserWithRoleEntity]),
    forwardRef(() => RoleModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secretkey'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
