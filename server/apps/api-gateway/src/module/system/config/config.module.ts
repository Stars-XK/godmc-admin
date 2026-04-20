import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { SysConfigEntity } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SysConfigEntity]),
    ClientsModule.register([
      {
        name: 'MICRO_SYSTEM',
        transport: Transport.TCP,
      },
    ]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class SysConfigModule {}
