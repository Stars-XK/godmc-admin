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
      const captchaEnabled: boolean = true; // 此处简化处理：可以后续引入微服务间的配置调用

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
