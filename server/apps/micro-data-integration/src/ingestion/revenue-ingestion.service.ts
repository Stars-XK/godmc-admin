import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TdengineService } from '../tdengine/tdengine.service';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';
import { DataIntegrationSourceEntity } from '@app/common/entities/data-integration/data-source.entity';
import { SysConfigEntity } from '@app/common';
import dayjs from 'dayjs';
import * as mysql from 'mysql2/promise';

@Injectable()
export class RevenueIngestionService {
  private readonly logger = new Logger(RevenueIngestionService.name);

  private taskQueue: Array<{ zoneCode: string, startDate: string, endDate: string, taskType: 'historical' | 'backtrack' }> = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(WaterRevenueUserEntity)
    private readonly revenueUserRep: Repository<WaterRevenueUserEntity>,
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRep: Repository<SysConfigEntity>,
    @InjectRepository(DataIntegrationSourceEntity)
    private readonly dataSourceRep: Repository<DataIntegrationSourceEntity>,
    private readonly tdengineService: TdengineService,
    private readonly configService: ConfigService,
  ) {}

  async triggerHistoricalBatch(zoneCode: string, startDate: string, endDate: string) {
    this.logger.log(`接收到历史跑批任务指令: [分区: ${zoneCode || '全部'}] ${startDate} 至 ${endDate}`);

    let currentStart = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentStart.isBefore(end)) {
      let currentEnd = currentStart.add(1, 'month').subtract(1, 'day');
      if (currentEnd.isAfter(end)) currentEnd = end;

      this.taskQueue.push({
        zoneCode,
        startDate: currentStart.format('YYYY-MM-DD'),
        endDate: currentEnd.format('YYYY-MM-DD'),
        taskType: 'historical'
      });
      currentStart = currentStart.add(1, 'month');
    }

    this.processQueue();
    return { message: '历史数据回溯跑批任务已提交队列，后台切片处理中', queueLength: this.taskQueue.length };
  }

  async detectAndFillMissingData() {
    this.logger.log('开始执行自动缺失检测与回溯补全引擎...');
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    this.taskQueue.push({
      zoneCode: null,
      startDate,
      endDate,
      taskType: 'backtrack'
    });

    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      try {
        await this.processTimeSlice(task.zoneCode, task.startDate, task.endDate, task.taskType);
      } catch (err) {
        this.logger.error(`任务处理失败: ${JSON.stringify(task)}`, err.stack);
      }
    }
    this.isProcessing = false;
    this.logger.log('所有数据拉取与清洗任务处理完毕');
  }

  /**
   * 从配置的外部营收数据源（如营收系统MySQL数据库）读取实际营收数据
   * 如果没有配置外部数据源，则从本地营收用户表读取
   */
  private async fetchRevenueDataFromSource(
    users: WaterRevenueUserEntity[],
    startDate: string,
    endDate: string,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // 查找类型为 MYSQL 的营收数据源配置（通过 config key 标识）
    const sourceConfig = await this.sysConfigRep.findOne({
      where: { configKey: 'revenue.source.id' }
    });

    if (sourceConfig && sourceConfig.configValue) {
      try {
        const source = await this.dataSourceRep.findOne({
          where: { id: parseInt(sourceConfig.configValue, 10) }
        });
        if (source && source.type.toUpperCase() === 'MYSQL') {
          return await this.fetchFromMysqlSource(source, users, startDate, endDate);
        }
      } catch (e) {
        this.logger.warn(`从外部营收数据源读取失败，回退到本地数据: ${e.message}`);
      }
    }

    // 回退：从营收用户表自身读取（如导入时填充的月消费数据）
    this.logger.log('未配置外部营收数据源，尝试从本地营收用户表读取月度消费数据...');
    return await this.fetchFromLocalUsers(users, startDate, endDate);
  }

  /**
   * 从外部 MySQL 营收数据库读取实际营收金额
   */
  private async fetchFromMysqlSource(
    source: DataIntegrationSourceEntity,
    users: WaterRevenueUserEntity[],
    startDate: string,
    endDate: string,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    const billingTable = await this.sysConfigRep.findOne({
      where: { configKey: 'revenue.source.billing_table' }
    });
    const userNoColumn = await this.sysConfigRep.findOne({
      where: { configKey: 'revenue.source.user_no_column' }
    });
    const amountColumn = await this.sysConfigRep.findOne({
      where: { configKey: 'revenue.source.amount_column' }
    });
    const dateColumn = await this.sysConfigRep.findOne({
      where: { configKey: 'revenue.source.date_column' }
    });

    const table = billingTable?.configValue || 'billing_records';
    const uCol = userNoColumn?.configValue || 'user_no';
    const aCol = amountColumn?.configValue || 'amount';
    const dCol = dateColumn?.configValue || 'bill_date';

    try {
      const connection = await mysql.createConnection({
        host: source.connectionStr || 'localhost',
        port: 3306,
        user: source.username || 'root',
        password: source.password || '',
        database: (source as any).database || 'billing',
      });

      const userNos = users.map(u => u.userNo);
      const batchSize = 200;
      for (let i = 0; i < userNos.length; i += batchSize) {
        const chunk = userNos.slice(i, i + batchSize);
        const placeholders = chunk.map(() => '?').join(',');
        const sql = `SELECT ${uCol} AS user_no, SUM(${aCol}) AS total_amount
                     FROM \`${table}\`
                     WHERE ${uCol} IN (${placeholders})
                     AND ${dCol} >= ? AND ${dCol} <= ?
                     GROUP BY ${uCol}`;
        const params = [...chunk, startDate, endDate];
        const [rows] = await connection.execute(sql, params);
        for (const row of rows as any[]) {
          result.set(row.user_no, parseFloat(row.total_amount) || 0);
        }
      }

      await connection.end();
      this.logger.log(`从外部营收MySQL数据库成功读取 ${result.size} 条用户营收数据`);
    } catch (e) {
      this.logger.error(`从外部营收MySQL数据库读取失败: ${e.message}`);
    }

    return result;
  }

  /**
   * 从本地营收用户表回退读取（当无外部数据源时）
   */
  private async fetchFromLocalUsers(
    users: WaterRevenueUserEntity[],
    startDate: string,
    endDate: string,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // 查询 TDengine 中已有的营收聚合数据作为近似值
    for (const user of users) {
      try {
        const sql = `SELECT SUM(val) AS total FROM water_iot.revenue_meters_1d
                     WHERE user_no = '${user.userNo}'
                     AND ts >= '${startDate}' AND ts <= '${endDate}'`;
        const data = await this.tdengineService.querySql(sql);
        if (data && (data as any).data && (data as any).data.length > 0) {
          const total = parseFloat((data as any).data[0][0]) || 0;
          if (total > 0) result.set(user.userNo, total);
        }
      } catch (e) {
        // TDengine 查询可能因表不存在而失败，静默处理
      }
    }

    if (result.size === 0) {
      this.logger.warn(
        `未找到 ${users.length} 个用户在 ${startDate}~${endDate} 期间的本地营收数据。` +
        `请配置外部营收数据源（设置 sys_config 中 revenue.source.id 指向有效 MYSQL 数据源）`
      );
    }

    return result;
  }

  private async processTimeSlice(zoneCode: string, startDate: string, endDate: string, taskType: string) {
    this.logger.log(`开始处理切片任务 [${taskType}]: ${startDate} 至 ${endDate} (分区: ${zoneCode || '全部'})`);

    let calcStrategy = 'month_to_day';
    try {
      const conf = await this.sysConfigRep.findOne({ where: { configKey: 'revenue.calc.strategy' } });
      if (conf) calcStrategy = conf.configValue;
    } catch (e) {}

    const query = this.revenueUserRep.createQueryBuilder('u')
      .where('u.delFlag = :delFlag', { delFlag: '0' });
    if (zoneCode) query.andWhere('u.zoneCode = :zoneCode', { zoneCode });
    const users = await query.getMany();

    if (users.length === 0) {
      this.logger.log(`未找到相关分区(${zoneCode})的营收用户，跳过该切片`);
      return;
    }

    this.logger.log(`正在拉取 ${users.length} 个用户的营收源数据...`);

    // 从真实数据源获取营收金额
    const revenueDataMap = await this.fetchRevenueDataFromSource(users, startDate, endDate);

    let insertCount = 0;
    const noDataUsers: string[] = [];

    const writePromises = users.map(async user => {
      const monthlyTotal = revenueDataMap.get(user.userNo);

      if (monthlyTotal === undefined || monthlyTotal === null) {
        noDataUsers.push(user.userNo);
        return;
      }

      if (calcStrategy === 'month_to_day') {
        const days = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
        const dailyAvg = monthlyTotal / days;

        for (let i = 0; i < days; i++) {
          const ts = dayjs(startDate).add(i, 'day').toDate();
          await this.tdengineService.insertRevenueData('1d', user.userNo, user.zoneCode, dailyAvg, ts);
          insertCount++;
        }
      } else {
        const ts = dayjs(startDate).toDate();
        await this.tdengineService.insertRevenueData('1mo', user.userNo, user.zoneCode, monthlyTotal, ts);
        insertCount++;
      }
    });

    await Promise.all(writePromises);

    if (noDataUsers.length > 0) {
      this.logger.warn(
        `${noDataUsers.length}/${users.length} 个用户在 ${startDate}~${endDate} 期间无营收数据，已跳过。` +
        `前5个缺失用户: ${noDataUsers.slice(0, 5).join(', ')}`
      );
    }

    this.logger.log(`切片处理完成，向 TDengine 写入 ${insertCount} 条营收记录（${users.length - noDataUsers.length} 个用户有数据）。`);
  }
}
