import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';

@Injectable()
export class BurstAlertService {
  private readonly logger = new Logger(BurstAlertService.name);

  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly alarmRuleRep: Repository<SysAlarmRuleEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly alarmHistoryRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  /**
   * 高置信度爆管事件自动生成报警
   */
  async createBurstAlarm(event: {
    id: number;
    zoneCode: string;
    pipeCode?: string;
    burstType: string;
    confidence: number;
    severity: number;
    description: string;
    anomalyTime: Date;
  }): Promise<void> {
    if (event.confidence < 70 || event.severity < 2) return;

    try {
      // 查找或创建爆管报警规则
      let rule = await this.alarmRuleRep.findOne({
        where: { ruleName: '爆管自动报警', status: '0' },
      });

      if (!rule) {
        rule = new SysAlarmRuleEntity();
        rule.ruleName = '爆管自动报警';
        rule.ruleType = '2'; // 区域级
        rule.scopeType = 'zone';
        rule.scopeValue = event.zoneCode;
        rule.ruleConditions = {
          operator: 'AND',
          conditions: [
            { field: 'burst.confidence', operator: '>=', value: 70 },
            { field: 'burst.severity', operator: '>=', value: 3 },
          ],
        } as any;
        rule.ruleActions = {
          actions: [
            { type: 'log', enabled: true },
            { type: 'notify', enabled: true },
          ],
        } as any;
        rule.status = '0';
        await this.alarmRuleRep.save(rule);
      }

      // 创建报警历史记录
      const history = new SysAlarmHistoryEntity();
      history.ruleId = rule.ruleId;
      history.ruleName = rule.ruleName;
      history.alarmSource = event.pipeCode || event.zoneCode;
      history.alarmLevel = event.severity >= 3 ? '1' : '2';
      history.alarmContent = `[${event.burstType}][置信度${event.confidence}%] ${event.description}`;
      history.alarmTime = event.anomalyTime;
      history.status = '0';
      await this.alarmHistoryRep.save(history);

      this.logger.log(`爆管报警已生成: 事件#${event.id}, 置信度${event.confidence}%`);
    } catch (e) {
      this.logger.error(`爆管报警生成失败: ${e.message}`);
    }
  }
}
