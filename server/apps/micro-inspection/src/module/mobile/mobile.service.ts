import { Injectable } from '@nestjs/common';
import { ResultData } from '@app/common/utils/result';

@Injectable()
export class MobileService {
  async health() {
    return ResultData.ok({ mobile: 'ok' });
  }
}
