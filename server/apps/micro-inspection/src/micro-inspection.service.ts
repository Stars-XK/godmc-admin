import { Injectable } from '@nestjs/common';
import { ResultData } from '@app/common/utils/result';

@Injectable()
export class MicroInspectionService {
  health() {
    return ResultData.ok({
      service: 'micro-inspection',
      status: 'running',
      time: new Date().toISOString(),
    });
  }
}
