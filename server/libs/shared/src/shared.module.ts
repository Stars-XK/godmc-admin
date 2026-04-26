import { Module, Global } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { AxiosModule } from './axios/axios.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as liaoliaoRedisModule, RedisClientOptions } from '@songkeys/nestjs-redis';

@Global()
@Module({
  imports: [
    liaoliaoRedisModule.forRootAsync(
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          return {
            closeClient: true,
            readyLog: true,
            errorLog: true,
            config: config.get<RedisClientOptions>('redis'),
          };
        },
      },
      true,
    ),
    RedisModule,
    AxiosModule,
  ],
})
export class SharedModule {}
