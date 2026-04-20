import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RedisService } from '@app/shared';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { ResultData } from '@app/common/utils/result';

@ApiTags('监控-服务注册中心')
@ApiBearerAuth()
@Controller('monitor/registry')
export class RegistryController {
  constructor(private readonly redisService: RedisService) {}

  @ApiOperation({ summary: '获取在线微服务列表' })
  @RequirePermission('monitor:registry:list')
  @Get('list')
  async getOnlineServices() {
    const redis = this.redisService.getRedis();
    const keys = await redis.keys('microservice:*');
    const services = [];
    
    if (keys && keys.length > 0) {
      const values = await redis.mget(...keys);
      for (let i = 0; i < values.length; i++) {
        if (values[i]) {
          try {
            services.push(JSON.parse(values[i]));
          } catch (e) {}
        }
      }
    }
    return ResultData.ok(services);
  }
}
