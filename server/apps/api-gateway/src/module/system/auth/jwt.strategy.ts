import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/shared';
import { CacheEnum } from '@app/common/enum/index';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.secretkey'),
    });
  }

  async validate(payload: { uuid: string; userId: string; iat: Date }) {
    const user = await this.redisService.get(`${CacheEnum.LOGIN_TOKEN_KEY}${payload.uuid}`);
    if (!user) throw new UnauthorizedException('登录已过期，请重新登录');
    return user;
  }
}
