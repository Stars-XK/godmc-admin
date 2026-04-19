import { Inject } from '@nestjs/common';
import { CacheEnum } from '@app/common/enum';
import { paramsKeyGetObj } from '@app/common/utils/decorator';
import { ResultData } from '@app/common/utils/result';
import { RedisService } from '@app/shared';

export function Captcha(CACHE_KEY: string) {
  const injectRedis = Inject(RedisService);

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');

    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // First try to get from redis directly
      let enable = await this.redisService.get(CacheEnum.SYS_CONFIG_KEY + 'sys.account.captchaEnabled');
      
      // If not in redis, fallback to configService if available, otherwise default to true
      if (enable === null || enable === undefined) {
        if (this.configService && typeof this.configService.getConfigValue === 'function') {
          enable = await this.configService.getConfigValue('sys.account.captchaEnabled');
        } else {
          enable = 'true'; // default
        }
      }

      const captchaEnabled: boolean = enable === 'true';

      if (captchaEnabled) {
        const user = paramsKeyGetObj(originMethod, CACHE_KEY, args);
        const code = await this.redisService.get(CacheEnum.CAPTCHA_CODE_KEY + user.uuid);

        if (!user.code) return ResultData.fail(500, `请输入验证码`);
        if (!code) return ResultData.fail(500, `验证码已过期`);
        if (code !== user.code) return ResultData.fail(500, `验证码错误`);
      }

      const result = await originMethod.apply(this, args);

      return result;
    };
  };
}
