import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { RedisService } from '@app/shared/redis/redis.service';

@Injectable()
export class StatusEngineService implements OnModuleInit {
  private readonly logger = new Logger(StatusEngineService.name);
  private readonly GLOBAL_DEFAULT_CYCLE = 15; // 默认超时时间 15 分钟

  // 内存缓存设备树结构
  private pointMap = new Map<string, any>();
  private deviceMap = new Map<string, any>();
  private stationMap = new Map<string, any>();

  constructor(
    @InjectRepository(WaterPointEntity) private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity) private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterStationEntity) private readonly stationRep: Repository<WaterStationEntity>,
    private readonly redisService: RedisService,
    @Inject('MICRO_WATER_BASIC') private readonly waterBasicClient: ClientProxy,
  ) {}

  async onModuleInit() {
    // 延迟加载，防止启动冲突
    setTimeout(() => {
      this.refreshAssetTree();
    }, 5000);
  }

  // 每小时全量刷新一次设备树结构
  @Cron(CronExpression.EVERY_HOUR)
  async refreshAssetTree() {
    try {
      // 查出所有未删除且启用(或曾停用但需监控)的资产，此处简化为全量
      const points = await this.pointRep.find({ where: { delFlag: '0' } });
      const devices = await this.deviceRep.find({ where: { delFlag: '0' } });
      const stations = await this.stationRep.find({ where: { delFlag: '0' } });

      this.pointMap.clear();
      this.deviceMap.clear();
      this.stationMap.clear();

      points.forEach(p => this.pointMap.set(p.code, p));
      devices.forEach(d => this.deviceMap.set(d.code, d));
      stations.forEach(s => this.stationMap.set(s.code, s));
      
      this.logger.log(`刷新设备树成功: 测点${points.length} 设备${devices.length} 站点${stations.length}`);
    } catch (e) {
      this.logger.error('刷新设备树失败', e.message);
    }
  }

  // 每分钟执行一次心跳状态检测
  @Cron(CronExpression.EVERY_MINUTE)
  async checkStatus() {
    if (this.pointMap.size === 0) return; // 还没加载完

    const now = Date.now();
    const redisClient = this.redisService.getClient();
    
    // 1. 获取所有测点最新活跃时间
    const activeTimes = await redisClient.hgetall('iot:point:active');
    const activeCount = Object.keys(activeTimes || {}).length;
    
    // 获取上次的状态树用于比对增量
    const lastTreeStr = await redisClient.get('iot:status:tree');
    const lastTree = lastTreeStr ? JSON.parse(lastTreeStr) : {};
    const newTree: Record<string, string> = {};

    const changedPoints = [];
    const changedDevices = [];
    const changedStations = [];

    // 2. 计算测点状态
    const deviceChildrenStatus = new Map<string, string[]>(); // key: deviceCode, value: array of statuses ('0'|'2')

    for (const [pCode, point] of this.pointMap.entries()) {
      // 获取周期：测点独立周期 > 设备继承周期 > 全局默认
      let cycle = point.expectedCycle;
      if (!cycle) {
        const device = this.deviceMap.get(point.deviceCode);
        cycle = device?.expectedCycle || this.GLOBAL_DEFAULT_CYCLE;
      }

      const lastActive = activeTimes[pCode] ? parseInt(activeTimes[pCode], 10) : 0;
      const isTimeout = (now - lastActive) > cycle * 60 * 1000;
      
      let status = isTimeout ? '2' : '0'; // 0: 在线, 2: 离线
      
      // 如果没有超时且当前已经是报警状态，则保留报警状态（报警由其他规则引擎触发）
      if (!isTimeout && point.iotStatus === '3') {
        status = '3';
      }

      newTree[`p_${pCode}`] = status;

      // 增量判定
      if (lastTree[`p_${pCode}`] !== status || point.iotStatus !== status) {
        changedPoints.push({ code: pCode, iotStatus: status });
        point.iotStatus = status; // 内存同步
      }

      // 归集到所属设备
      if (point.deviceCode) {
        if (!deviceChildrenStatus.has(point.deviceCode)) {
          deviceChildrenStatus.set(point.deviceCode, []);
        }
        deviceChildrenStatus.get(point.deviceCode).push(status);
      }
    }

    // 3. 计算设备状态
    const stationChildrenStatus = new Map<string, string[]>();

    for (const [dCode, device] of this.deviceMap.entries()) {
      const pStatuses = deviceChildrenStatus.get(dCode) || ['2']; // 没测点的默认离线
      
      let status = '0';
      
      // 只要有一个测点报警(3)，设备就报警
      if (pStatuses.includes('3')) {
        status = '3';
      } else if (pStatuses.every(s => s === '0')) {
        status = '0'; // 全在线
      } else if (pStatuses.every(s => s === '2')) {
        status = '2'; // 全离线
      } else {
        status = '1'; // 部分异常
      }

      newTree[`d_${dCode}`] = status;

      if (lastTree[`d_${dCode}`] !== status || device.iotStatus !== status) {
        changedDevices.push({ code: dCode, iotStatus: status });
        device.iotStatus = status; // 内存同步
      }

      // 归集到所属站点
      if (device.stationCode) {
        if (!stationChildrenStatus.has(device.stationCode)) {
          stationChildrenStatus.set(device.stationCode, []);
        }
        stationChildrenStatus.get(device.stationCode).push(status);
      }
    }

    // 4. 计算站点状态
    for (const [sCode, station] of this.stationMap.entries()) {
      const dStatuses = stationChildrenStatus.get(sCode) || ['2'];

      let status = '0';
      
      if (dStatuses.includes('3')) {
        status = '3'; // 只要有一个设备报警(3)，站点就报警
      } else if (dStatuses.every(s => s === '0')) {
        status = '0'; // 全在线
      } else if (dStatuses.every(s => s === '2')) {
        status = '2'; // 全离线
      } else {
        status = '1'; // 部分异常
      }

      newTree[`s_${sCode}`] = status;

      if (lastTree[`s_${sCode}`] !== status || station.iotStatus !== status) {
        changedStations.push({ code: sCode, iotStatus: status });
        station.iotStatus = status; // 内存同步
      }
    }

    // 5. 保存最新状态树到 Redis
    await redisClient.set('iot:status:tree', JSON.stringify(newTree));

    // 6. 如果有变更，发起增量更新请求
    const totalChanges = changedPoints.length + changedDevices.length + changedStations.length;
    if (totalChanges > 0) {
      this.logger.log(`检测到状态变更，触发回写: 活跃测点${activeCount} 变更测点${changedPoints.length} 设备${changedDevices.length} 站点${changedStations.length}`);
      try {
        this.waterBasicClient.emit('water.status.batchUpdate', {
          points: changedPoints,
          devices: changedDevices,
          stations: changedStations
        });
        this.logger.log(`状态回写事件已发送: water.status.batchUpdate (payload=${totalChanges})`);
      } catch (e) {
        this.logger.error('回写状态通知失败', e);
      }
    }
  }
}
