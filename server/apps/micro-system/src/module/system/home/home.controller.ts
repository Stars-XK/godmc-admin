import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import {
  WaterZoneEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

@ApiTags('首页仪表盘')
@Controller('system/home')
export class HomeController {
  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly alarmHistoryRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  @ApiOperation({ summary: '获取首页仪表盘统计数据' })
  @Get('stats')
  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [zoneCount, deviceCount, pointCount, alarmCount] = await Promise.all([
      this.zoneRep.count({ where: { delFlag: '0' as any } }),
      this.deviceRep.count({ where: { delFlag: '0' as any } }),
      this.pointRep.count({ where: { delFlag: '0' as any } }),
      this.alarmHistoryRep.count({
        where: { alarmTime: Between(todayStart, todayEnd) } as any,
      }),
    ]);

    return ResultData.ok({
      zoneCount,
      deviceCount,
      pointCount,
      alarmCount,
    });
  }
}
